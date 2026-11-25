import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import test from 'node:test';
import { initializeLogger, llm, stt, tokenize, tts, voice } from '@livekit/agents';
import { AudioFrame, dispose } from '@livekit/rtc-node';
import { WebSocketServer } from 'ws';
import { InterviewSTT } from '../factories/voice-pipeline.factory.ts';
import { InterviewTTS } from '../services/interview-tts.ts';
import { InterviewTurnDetector, InterviewVoiceAgent, isInterviewFarewellMessage } from '../services/interview-turns.ts';
import { SessionWatchdog } from '../services/session-watchdog.ts';

initializeLogger({ level: 'error', pretty: false });
test.after(() => dispose());
const config = { name: 'Catalina', voice: 'test-voice', language: 'es' };

test('el cierre del turno distingue fragmentos del registro y respuestas completas en ambos idiomas', async () => {
  const cases = [
    ['es', 'Validar de que, de pronto, no se, por decirlo así, no se.', false],
    ['es', 'Y aplicando los principios de desarrollo como lo son el…', false],
    ['es', 'Los principios claves que aplico.', false],
    ['es', 'Los principios clave que aplica.', false],
    ['es', 'Los principios clave que aplicó.', false],
    ['es', 'Las herramientas principales que escogí…', false],
    ['es', 'Los ejemplos demuestran que funciona.', true],
    ['es', 'Separé los módulos. Los principios que aplico…', false],
    ['es', 'Dame un momento. Ya terminé mi respuesta.', true],
    ['es', 'Dame un momento.', false],
    ['es', 'Para separar los módulos, lo que hice fue…', false],
    ['es', 'En mi primer proyecto, eh…', false],
    ['es', 'Espera, todavía no he terminado.', false],
    ['es', 'Los principios que aplico son responsabilidad única e inversión de dependencias.', true],
    ['es', 'No sé.', true],
    ['es', 'Esos son los principios que aplico.', true],
    ['en', 'The principles I use…', false],
    ['en', 'For example,', false],
    ['en', 'The second reason was, um…', false],
    ['en', 'I’m not finished.', false],
    ['en', 'The principles I use help keep the classes independent.', true],
    ['en', 'I don’t know.', true],
  ];
  for (const [language, text, complete] of cases) {
    const detector = new InterviewTurnDetector(language);
    const ctx = llm.ChatContext.empty();
    ctx.addMessage({ role: 'assistant', content: 'Última pregunta' });
    ctx.addMessage({ role: 'user', content: text });
    assert.equal(await detector.predictEndOfTurn(ctx) >= await detector.unlikelyThreshold(), complete, text);
    if (!complete) {
      const agent = new InterviewVoiceAgent({ instructions: 'Entrevista' }, detector);
      const reply = await agent.llmNode(ctx, {}, {});
      const chunks = [];
      for await (const chunk of reply) chunks.push(chunk);
      assert.equal(chunks.join(''), language === 'es' ? 'Tómate tu tiempo, te escucho.' : 'Take your time, I’m listening.');
    }
  }
});

test('una generación vacía cede la palabra y una respuesta con contenido se conserva', async (t) => {
  const ctx = llm.ChatContext.empty();
  ctx.addMessage({ role: 'user', content: 'Quiero añadir un detalle sobre las pruebas automáticas.' });
  const agent = new InterviewVoiceAgent({ instructions: 'Entrevista' }, new InterviewTurnDetector('es'));
  const usage = { id: 'end' };
  const text = { id: 'text', delta: { role: 'assistant', content: 'Adelante.' } };
  const tool = { id: 'tool', delta: { role: 'assistant', toolCalls: [{ name: 'finalizar' }] } };
  let input;
  t.mock.method(voice.Agent.prototype, 'llmNode', async () => ReadableStream.from(input));
  for (const [source, expected] of [
    [[usage], [usage, 'Tómate tu tiempo, te escucho.']],
    [[text, usage], [text, usage]],
    [[tool], [tool]],
  ]) {
    input = source;
    const result = await agent.llmNode(ctx, {}, {});
    assert.deepEqual(await Array.fromAsync(result), expected);
  }
});

test('un parcial pendiente recibe un solo reintento durante el silencio', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const session = new EventEmitter();
  const events = voice.AgentSessionEventTypes;
  const recognizer = new InterviewSTT({ apiKey: 'prueba' });
  const finalize = t.mock.method(recognizer, 'finalizeSegment', () => {});
  recognizer.attachTo(session);
  function state(newState) {
    const oldState = session.userState;
    session.userState = newState;
    session.emit(events.UserStateChanged, { oldState, newState });
  }
  state('speaking');
  session.emit(events.UserInputTranscribed, { transcript: 'y el patrón', isFinal: false });
  state('listening');
  state('speaking');
  t.mock.timers.tick(3000);
  assert.equal(finalize.mock.callCount(), 1);
  state('listening');
  t.mock.timers.tick(5000);
  t.mock.timers.tick(5000);
  assert.equal(finalize.mock.callCount(), 3);
  state('speaking');
  state('listening');
  session.emit(events.UserInputTranscribed, { transcript: 'y el patrón de diseño', isFinal: true });
  t.mock.timers.tick(3000);
  assert.equal(finalize.mock.callCount(), 4);
  session.emit(events.Close);
});

test('un parcial huérfano sin FINAL de Deepgram fuerza commitUserTurn en vez de congelar el turno', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const session = new EventEmitter();
  session.agentState = 'listening';
  let committed = 0;
  session.commitUserTurn = () => { committed += 1; };
  const events = voice.AgentSessionEventTypes;
  const recognizer = new InterviewSTT({ apiKey: 'prueba' });
  t.mock.method(recognizer, 'finalizeSegment', () => {});
  recognizer.attachTo(session);
  session.userState = 'speaking';
  session.emit(events.UserStateChanged, { oldState: 'listening', newState: 'speaking' });
  session.emit(events.UserInputTranscribed, { transcript: 'La experiencia de que', isFinal: false });
  session.userState = 'listening';
  session.emit(events.UserStateChanged, { oldState: 'speaking', newState: 'listening' });
  t.mock.timers.tick(1700);
  assert.equal(committed, 0, 'Primero debe esperar un breve margen tras el segundo Finalize');
  t.mock.timers.tick(800);
  assert.equal(committed, 1, 'Si Deepgram no confirma el parcial, debe forzar commitUserTurn()');
  session.emit(events.Close);
});

test('Deepgram confirma dos segmentos en la misma conexión aunque deje de recibir audio', { timeout: 5000 }, async (t) => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await once(server, 'listening');
  const connection = once(server, 'connection');
  const recognizer = new InterviewSTT({
    baseUrl: `ws://127.0.0.1:${server.address().port}`, apiKey: 'prueba', language: 'es', model: 'nova-2-general',
  });
  const stream = recognizer.stream();
  t.after(async () => {
    stream.close();
    await recognizer.close();
    await new Promise((resolve) => server.close(resolve));
  });
  const [socket] = await connection;
  const segments = ['y el patrón', 'de creación'];
  let segmentsFinalized = 0;
  let gotAudio = false;
  let bytesReceived = 0;
  socket.on('message', (data, binary) => {
    if (binary) {
      gotAudio = true;
      bytesReceived += data.length;
    } else if (JSON.parse(data).type === 'Finalize') {
      assert.ok(gotAudio, 'El audio debe salir antes de Finalize');
      gotAudio = false;
      socket.send(JSON.stringify({
        type: 'Results', metadata: { request_id: 'test' }, is_final: true, speech_final: true,
        channel: { alternatives: [{ transcript: segments[segmentsFinalized++], confidence: 1, words: [] }] },
      }));
    }
  });
  for (const text of segments) {
    stream.pushFrame(new AudioFrame(new Int16Array(1600).fill(1000), 16000, 1, 1600));
    for (let i = 0; i < 18; i++) {
      stream.pushFrame(new AudioFrame(new Int16Array(1600), 16000, 1, 1600));
    }
    recognizer.finalizeSegment();
    for await (const event of stream) {
      if (event.type === stt.SpeechEventType.FINAL_TRANSCRIPT) {
        assert.equal(event.alternatives[0].text, text);
        break;
      }
    }
  }
  assert.equal(segmentsFinalized, 2);
  assert.equal(bytesReceived, 2 * 19 * 1600 * 2, 'El silencio entre frases debe conservarse en la línea de tiempo de Deepgram');
});

test('la primera palabra al retomar la respuesta cancela la réplica que aún se está preparando', () => {
  const session = new EventEmitter();
  const events = voice.AgentSessionEventTypes;
  const recognizer = new InterviewSTT({ apiKey: 'prueba' });
  recognizer.attachTo(session);
  session.userState = 'speaking';
  session.agentState = 'thinking';
  const handle = {
    allowInterruptions: true, interrupted: false, done: () => false, addDoneCallback() {},
    interrupt() { this.interrupted = true; },
  };
  session.emit(events.SpeechCreated, { source: 'generate_reply', speechHandle: handle });
  session.emit(events.UserInputTranscribed, { isFinal: false, transcript: '' });
  assert.equal(handle.interrupted, false);
  session.emit(events.UserInputTranscribed, { isFinal: false, transcript: 'además' });
  assert.equal(handle.interrupted, true);
  session.emit(events.Close);
});

test('un HTTP 402 conserva la frase y los turnos siguientes reciben audio', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const body = JSON.parse(options.body);
    const host = new URL(url).hostname;
    requests.push([host, body.transcript ?? body.text]);
    if (host === 'api.cartesia.ai') return new Response(null, { status: 402 });
    assert.equal(new URL(url).searchParams.get('model'), 'aura-2-celeste-es');
    return new Response(new Int16Array(800).fill(1000).buffer);
  });
  const output = new tts.StreamAdapter(new InterviewTTS(config, 'prueba', 'prueba'), new tokenize.basic.SentenceTokenizer());
  t.after(() => output.close());
  for (const text of ['Escucho tu explicación.', 'Adelante con el siguiente ejemplo.']) {
    const speech = output.stream();
    speech.pushText(text);
    speech.endInput();
    let samples = 0;
    for await (const event of speech) {
      if (event === tts.SynthesizeStream.END_OF_STREAM) break;
      samples += event.frame.samplesPerChannel;
      assert.equal(event.frame.data[0], 1000);
    }
    speech.close();
    assert.equal(samples, 800);
  }
  assert.deepEqual(requests, [
    ['api.cartesia.ai', 'Escucho tu explicación.'],
    ['api.deepgram.com', 'Escucho tu explicación.'],
    ['api.deepgram.com', 'Adelante con el siguiente ejemplo.'],
  ]);
});

test('Cartesia conserva la voz elegida cuando está disponible', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).hostname, 'api.cartesia.ai');
    assert.equal(JSON.parse(options.body).voice.id, 'test-voice');
    return new Response(new Int16Array([1, 2, 3]).buffer);
  });
  const output = new InterviewTTS(config, 'prueba', 'prueba');
  const response = await output.requestAudio('Hola', new AbortController().signal);
  assert.deepEqual(new Int16Array(await response.arrayBuffer()), new Int16Array([1, 2, 3]));
});

test('si ambos proveedores rechazan la síntesis, la sesión recibe el 402 y ningún audio falso', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 402 }));
  const output = new tts.StreamAdapter(new InterviewTTS(config, 'prueba', 'prueba'), new tokenize.basic.SentenceTokenizer());
  t.after(() => output.close());
  const errors = [];
  output.on('error', ({ error }) => errors.push(error.statusCode));
  const speech = output.stream();
  speech.pushText('Prueba sin saldo.');
  speech.endInput();
  for await (const event of speech) assert.equal(event, tts.SynthesizeStream.END_OF_STREAM);
  speech.close();
  assert.deepEqual(errors, [402]);
});

test('isInterviewFarewellMessage distingue despedidas de cierre de saludos y preguntas intermedias', () => {
  assert.equal(
    isInterviewFarewellMessage(
      'Muchas gracias por tu tiempo y participación en esta entrevista para Frontend Developer. Ya podrás consultar el análisis detallado de tu desempeño en el dashboard. ¡Mucho éxito y hasta pronto!'
    ),
    true
  );
  assert.equal(
    isInterviewFarewellMessage(
      'Thank you so much for your time and participation in this interview. You can review your detailed feedback report on the dashboard shortly. Best of luck and goodbye!'
    ),
    true
  );
  assert.equal(
    isInterviewFarewellMessage(
      '¡Hola! Te doy la bienvenida a tu entrevista técnica en DevCareer AI. ¿Cómo te encuentras hoy? ¿Listo para comenzar?'
    ),
    false
  );
  assert.equal(
    isInterviewFarewellMessage(
      'Excelente, muchas gracias. Pasemos a la siguiente pregunta: ¿Qué es el Virtual DOM en React?'
    ),
    false
  );
});

test('SessionWatchdog emite interview_completed automáticamente tras finalizar la despedida', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const session = new EventEmitter();
  let shutdownCalled = 0;
  session.shutdown = () => { shutdownCalled += 1; };
  const published = [];
  const room = new EventEmitter();
  room.localParticipant = {
    publishData(data, opts) {
      published.push({ topic: opts?.topic, body: JSON.parse(new TextDecoder().decode(data)) });
    },
  };
  const watchdog = new SessionWatchdog({ session, room, isEs: true });
  const events = voice.AgentSessionEventTypes;

  // Turno del candidato + despedida del evaluador mientras habla
  session.emit(events.ConversationItemAdded, { item: { role: 'user', content: ['Listo, esa fue mi última respuesta.'] } });
  session.emit(events.AgentStateChanged, { oldState: 'thinking', newState: 'speaking' });
  const farewell = 'Muchas gracias por tu tiempo y participación en esta entrevista. Ya podrás consultar tu análisis en el dashboard. ¡Hasta pronto!';
  session.emit(events.ConversationItemAdded, { item: { role: 'assistant', content: [farewell], interrupted: false } });

  // Aún está hablando -> todavía no debe emitir cierre
  t.mock.timers.tick(2000);
  assert.equal(published.filter((p) => p.topic === 'interview-control').length, 0);

  // Termina de hablar -> tras 1500ms de drenaje WebRTC emite interview_completed
  session.emit(events.AgentStateChanged, { oldState: 'speaking', newState: 'listening' });
  t.mock.timers.tick(1500);
  const controlEvents = published.filter((p) => p.topic === 'interview-control');
  assert.equal(controlEvents.length, 1);
  assert.equal(controlEvents[0].body.action, 'interview_completed');
  assert.equal(controlEvents[0].body.finalMessage, farewell);

  // Si el cliente no desconecta en 3500ms, activa shutdown de respaldo
  t.mock.timers.tick(3500);
  assert.equal(shutdownCalled, 1);
  watchdog.dispose();
});
