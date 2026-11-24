// Prueba de integración opcional. Desde livekit-agent:
// node --import tsx --env-file=.env test/interview-audio-live.mjs
// Usa los servicios de voz configurados y frases ficticias. No se conecta a una sala.
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { initializeLogger, voice } from '@livekit/agents';
import { AudioFrame } from '@livekit/rtc-node';
import * as silero from '@livekit/agents-plugin-silero';
import { VoicePipelineFactory } from '../factories/voice-pipeline.factory.ts';
import { InterviewTTS } from '../services/interview-tts.ts';
import { InterviewTurnDetector, InterviewVoiceAgent } from '../services/interview-turns.ts';
import { VoiceAgentStrategyResolver } from '../strategies/voice-agent.strategy.ts';

initializeLogger({ pretty: false, level: 'error' });
const rate = 16000;
const frameSize = rate / 50;
const strategy = VoiceAgentStrategyResolver.getStrategy('jeronimo-es');
const config = strategy.getVoiceConfig('jeronimo-es');
const fixtures = new InterviewTTS(config, process.env.CARTESIA_API_KEY, process.env.DEEPGRAM_API_KEY);
const phrases = {
  listStart: 'Los principios clave que aplico',
  listEnd: 'son responsabilidad única e inversión de dependencias.',
  exampleStart: 'Para separar los módulos de la aplicación, lo que hice fue',
  exampleEnd: 'dividir el código y revisar la base de datos.',
  interruption: 'Quiero añadir un detalle sobre las pruebas automáticas.',
  finalAnswer: 'Por último revisaría los permisos de acceso.',
};

async function waitFor(predicate, label, timeoutMs = 20000) {
  const until = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > until) throw new Error(`Tiempo agotado esperando ${label}`);
    await sleep(30);
  }
}

class TestSpeaker extends voice.AudioOutput {
  duration = 0;
  audibleFrames = 0;
  interruptions = 0;
  interrupted = false;
  async captureFrame(frame) {
    await super.captureFrame(frame);
    if (!this.duration) this.onPlaybackStarted(Date.now());
    this.duration += frame.samplesPerChannel / frame.sampleRate;
    if (frame.data.some((sample) => Math.abs(sample) > 50)) this.audibleFrames++;
    await sleep(frame.samplesPerChannel * 1000 / frame.sampleRate);
  }
  clearBuffer() { this.interrupted = true; }
  flush() {
    super.flush();
    if (!this.duration) return;
    this.onPlaybackFinished({ playbackPosition: this.duration, interrupted: this.interrupted });
    if (this.interrupted) this.interruptions++;
    this.duration = 0;
    this.interrupted = false;
  }
}

async function prepareClips() {
  const clips = {};
  for (const [name, phrase] of Object.entries(phrases)) {
    const response = await fixtures.requestAudio(phrase, AbortSignal.timeout(15000));
    const pcm = new Int16Array(await response.arrayBuffer());
    // Mide la pausa entre sonidos. El proveedor puede añadir silencio en ambos extremos.
    const first = pcm.findIndex((sample) => Math.abs(sample) > 180);
    const last = pcm.findLastIndex((sample) => Math.abs(sample) > 180);
    assert.ok(first >= 0, 'La frase de prueba debe contener voz');
    clips[name] = pcm.subarray(Math.max(0, first - frameSize), last + frameSize + 1);
  }
  return clips;
}

async function runInterview(clips) {
  const vad = await silero.VAD.load({ activationThreshold: 0.55, minSpeechDuration: 220, minSilenceDuration: 1200, prefixPaddingDuration: 400 });
  const detector = new InterviewTurnDetector(config.language);
  const session = VoicePipelineFactory.createSession(config, vad, detector);
  const speaker = new TestSpeaker(rate);
  const turns = [];
  const replies = [];
  const started = Date.now();
  const trace = [];
  const record = (event) => trace.push(`${((Date.now() - started) / 1000).toFixed(1)}s ${event}`);
  session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => record(`usuario ${ev.newState}`));
  session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => record(`agente ${ev.newState}`));
  session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => record(`${ev.isFinal ? 'final' : 'parcial'}: ${ev.transcript}`));
  session.on(voice.AgentSessionEventTypes.Error, (ev) => record(`error: ${ev.error?.message}`));
  session.on(voice.AgentSessionEventTypes.MetricsCollected, ({ metrics }) => {
    if (metrics.type === 'llm_metrics') record(`LLM tokens=${metrics.completionTokens} cancelado=${metrics.cancelled}`);
    if (metrics.type === 'tts_metrics') record(`TTS caracteres=${metrics.charactersCount} audio=${metrics.audioDurationMs}ms`);
  });
  session.on(voice.AgentSessionEventTypes.ConversationItemAdded, ({ item }) => {
    record(`historial ${item.role}: ${item.textContent}`);
    if (item.role === 'user') turns.push(item.textContent);
    if (item.role === 'assistant') replies.push(item.textContent);
  });
  let input;
  const stream = new ReadableStream({ start(controller) { input = controller; } });
  session.input.audio = { stream, onAttached() {}, onDetached() {} };
  session.output.audio = speaker;
  const agent = new InterviewVoiceAgent({
    instructions: strategy.getInstructions('Desarrollador de Software', [
      '¿Cómo separaste los módulos de tu aplicación?',
      '¿Cómo comprobaste el resultado?',
      '¿Qué principios de diseño aplicas?',
    ]),
  }, detector);
  await session.start({ agent, record: false });
  let clip = null;
  let offset = 0;
  const pump = setInterval(() => {
    const data = new Int16Array(frameSize);
    if (clip) {
      data.set(clip.subarray(offset, offset + frameSize));
      offset += frameSize;
      if (offset >= clip.length) clip = null;
    }
    input.enqueue(new AudioFrame(data, rate, 1, frameSize));
  }, 20);
  async function speak(name) {
    offset = 0;
    clip = clips[name];
    await waitFor(() => !clip, 'fin de la frase de prueba');
  }
  try {
    await session.say('¿Qué principios de diseño aplicas?', { allowInterruptions: false }).waitForPlayout();
    const beforePause = replies.length;
    const framesBeforePause = speaker.audibleFrames;
    await speak('listStart');
    await sleep(8500);
    assert.equal(turns.length, 0, 'El fragmento debe mantener abierto el turno más allá del margen normal');
    await waitFor(() => replies.length > beforePause, 'invitación a completar la respuesta');
    assert.equal(replies[beforePause], 'Tómate tu tiempo, te escucho.');
    assert.ok(speaker.audibleFrames > framesBeforePause);
    await speak('listEnd');
    await waitFor(() => turns.length === 2 && session.agentState === 'speaking', 'respuesta tras la explicación completa');
    assert.match(turns[1], /responsabilidad|dependencias/i);
    await waitFor(() => session.agentState === 'listening', 'fin del turno de continuación', 45000);
    console.log('OK: tras agotar la espera, la IA cedió la palabra y recibió el final de la respuesta.');
    await speak('exampleStart');
    await sleep(6500);
    assert.equal(turns.length, 2, 'La pausa cerró prematuramente la respuesta');
    await speak('exampleEnd');
    await waitFor(() => session.agentState === 'speaking' && speaker.audibleFrames > 0, 'primera respuesta con audio');
    assert.equal(turns.length, 3);
    assert.match(turns[2], /m[oó]dulos/i);
    assert.match(turns[2], /divid|c[oó]digo|base de datos/i, 'Debe incluir también la continuación');
    console.log('OK: dos partes con una pausa de 6,5 s quedaron en un solo turno.');
    await speak('interruption');
    const before = speaker.audibleFrames;
    await waitFor(() => turns.length === 4 && session.agentState === 'speaking' && speaker.audibleFrames > before, 'respuesta a la interrupción');
    assert.match(turns[3], /pruebas/i);
    assert.ok(speaker.interruptions >= 1, 'La nueva voz debe detener la reproducción en curso');
    await waitFor(() => session.agentState === 'listening', 'fin de la respuesta a la interrupción', 45000);
    console.log('OK: la continuación llegó al historial y volvió a salir audio.');
    await speak('finalAnswer');
    const third = speaker.audibleFrames;
    await waitFor(() => turns.length === 5 && speaker.audibleFrames > third, 'audio del turno siguiente');
    assert.match(turns[4], /permisos/i);
    await waitFor(() => session.agentState === 'listening', 'fin del quinto turno', 45000);
    console.log(`OK: quinto turno completo. Se recibieron ${speaker.audibleFrames} frames con señal.`);
  } catch (error) {
    console.error(trace.join('\n'));
    throw error;
  } finally {
    clearInterval(pump);
    input.close();
    await session.close();
  }
}

try {
  const clips = await prepareClips();
  await runInterview(clips);
  if (process.argv.includes('--repeat')) await runInterview(clips);
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
