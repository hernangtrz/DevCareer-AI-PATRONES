import { cli, WorkerOptions, defineAgent, type JobContext, voice } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { VoiceAgentStrategyResolver, GreetingContext } from './strategies/voice-agent.strategy.js';

dotenv.config();

// Cargar Silero VAD con parámetros de alta sensibilidad y baja latencia
// - activationThreshold 0.35: detecta la voz del usuario sin omitir inicios suaves ni respuestas breves
// - minSilenceDuration 0.35: detecta el final de la respuesta en 350ms para un turno conversacional ágil
// - prefixPaddingDuration 0.3: conserva 300ms previos para que la primera sílaba nunca se corte
const vad = await silero.VAD.load({
  activationThreshold: 0.35,
  minSilenceDuration: 0.35,
  minSpeechDuration: 0.08,
  prefixPaddingDuration: 0.3,
});

export default defineAgent({
  entry: async (ctx: JobContext) => {
    console.log(`[Agent] Conectando a la sala: ${ctx.job.room?.name || 'desconocida'}`);
    await ctx.connect();
    console.log(`[Agent] Conectado a LiveKit.`);

    const roomName = ctx.job.room?.name || '';
    const parts = roomName.split('_');
    const voiceKey = parts[2] || 'jeronimo-es';
    const interviewId = parts[1] || 'interview_unknown';

    // SRP y OCP: Delegar la configuración de voz, diálogos y prompts a la estrategia
    const strategy = VoiceAgentStrategyResolver.getStrategy(voiceKey);
    const config = strategy.getVoiceConfig(voiceKey);

    let role = 'Software Developer';
    let company = '';
    let techstack: string[] = [];
    let questionsList: string[] = [];

    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      console.log(`[Agent] Buscando detalles de entrevista para id: ${interviewId}`);
      const res = await fetch(`${backendUrl}/api/livekit/interview-details?interviewId=${interviewId}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && data.interview) {
          role = data.interview.role || role;
          company = data.interview.company || '';
          techstack = data.interview.techstack || [];
          questionsList = data.interview.questions || [];

          // Si el role viene con formato "Cargo @ Empresa" o "Cargo en Empresa", extraer la empresa y limpiar el rol
          if (!company && role.includes(' @ ')) {
            const [cleanRole, parsedCompany] = role.split(' @ ');
            role = cleanRole.trim();
            company = parsedCompany.trim();
          } else if (!company && role.includes(' en ')) {
            const [cleanRole, parsedCompany] = role.split(' en ');
            role = cleanRole.trim();
            company = parsedCompany.trim();
          }

          console.log(`[Agent] Detalles obtenidos: rol="${role}", empresa="${company}", stack=[${techstack.join(', ')}], preguntas=${questionsList.length}`);
        }
      } else {
        console.error(`[Agent] Error al buscar detalles en backend: ${res.statusText}`);
      }
    } catch (err) {
      console.error(`[Agent] Excepción al buscar detalles en backend:`, err);
    }

    // Si no se obtuvieron preguntas del backend, obtener preguntas de respaldo de la estrategia
    if (questionsList.length === 0) {
      questionsList = strategy.getFallbackQuestions();
    }

    const greetingContext: GreetingContext = {
      interviewerName: config.name,
      role,
      company,
      techstack,
    };

    const greeting = strategy.getGreeting(config.name, greetingContext);
    console.log(`[Agent] Saludo inicial personalizado preparado:\n"${greeting}"`);

    // Generar instrucciones polimórficamente sin condicionales de idioma
    const instructions = strategy.getInstructions(role, questionsList, greetingContext);

    // Groq como LLM (modelo conversacional de ultra baja latencia)
    const groqModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
    console.log(`[Agent] Utilizando modelo LLM en Groq: ${groqModel}`);

    // Crear el pipeline con AgentSession optimizado para fluidez y baja latencia
    const session = new voice.AgentSession({
      vad,
      // Deepgram STT dinámico según idioma provisto por la estrategia
      stt: new deepgram.STT({
        model: 'nova-2-general',
        language: config.language,
      }),
      // Groq como LLM mediante plugin oficial
      llm: openai.LLM.withGroq({
        model: groqModel,
        apiKey: process.env.GROQ_API_KEY,
      }),
      // Cartesia TTS dinámico según la voz provista por la estrategia
      tts: new cartesia.TTS({
        model: 'sonic-2',
        voice: config.voice,
        language: config.language,
        encoding: 'pcm_s16le',
        sampleRate: 16000,
      }),
      // Warmup AEC reducido de 3000ms a 400ms para evitar el bloqueo inicial de audio
      aecWarmupDuration: 400,
      // Configuración de turnos conversacionales instantáneos
      turnHandling: {
        turnDetection: 'vad',
        endpointing: {
          mode: 'fixed',
          minDelay: 400, // 400ms de silencio para responder rápido y natural
          maxDelay: 2000,
        },
        interruption: {
          enabled: true,
          minDuration: 350,
          discardAudioIfUninterruptible: false,
        },
        preemptiveGeneration: {
          enabled: true, // Inicia inferencia mientras el usuario termina de hablar
        },
      },
    });

    // Logging de eventos para monitoreo y depuración en tiempo real
    session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      console.error('[Agent] Error en sesión de voz:', ev);
    });

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.transcript?.trim()) {
        console.log(`[Agent] Transcripción (${ev.isFinal ? 'FINAL' : 'parcial'}): "${ev.transcript.trim()}"`);
      }
    });

    session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => {
      console.log(`[Agent] Estado del candidato: ${ev.oldState} -> ${ev.newState}`);
    });

    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
      console.log(`[Agent] Estado del agente: ${ev.oldState} -> ${ev.newState}`);
    });

    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if ('role' in ev.item) {
        console.log(`[Agent] Historial [${ev.item.role}]: ${(ev.item.content || []).map((c: any) => typeof c === 'string' ? c : c?.text || '').join(' ')}`);
      }
    });

    const agent = new voice.Agent({
      instructions,
      tools: {},
    });

    // Iniciar la sesión vinculada a la sala de LiveKit
    await session.start({
      agent,
      room: ctx.room,
    });

    console.log('[Agent] Sesión iniciada. Verificando estado del participante...');
    if (ctx.room.remoteParticipants.size === 0) {
      await ctx.waitForParticipant();
    }
    console.log('[Agent] Participante listo. Enviando saludo inicial inmediato...');

    // Breve pausa para asegurar el pipeline WebRTC
    await new Promise((r) => setTimeout(r, 200));
    await session.say(greeting);
  },
});

// Registrar el proceso del CLI para arrancar el worker
cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
  })
);
