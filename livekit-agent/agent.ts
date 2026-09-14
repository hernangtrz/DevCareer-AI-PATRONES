import { cli, WorkerOptions, defineAgent, type JobContext, voice } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { VoiceAgentStrategyResolver } from './strategies/voice-agent.strategy.js';

dotenv.config();

// Cargar Voice Activity Detection (Silero VAD) una vez globalmente al iniciar el worker
const vad = await silero.VAD.load();

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
    const greeting = strategy.getGreeting(config.name);

    let role = 'Software Developer';
    let questionsList: string[] = [];

    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      console.log(`[Agent] Buscando detalles de entrevista para id: ${interviewId}`);
      const res = await fetch(`${backendUrl}/api/livekit/interview-details?interviewId=${interviewId}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && data.interview) {
          role = data.interview.role || role;
          questionsList = data.interview.questions || [];
          console.log(`[Agent] Preguntas obtenidas exitosamente del backend: ${questionsList.length}`);
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

    // Generar instrucciones polimórficamente sin condicionales de idioma
    const instructions = strategy.getInstructions(role, questionsList);

    // Groq como LLM (modelo conversacional de baja latencia sin tokens de razonamiento)
    const groqModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
    console.log(`[Agent] Utilizando modelo LLM en Groq: ${groqModel}`);

    // Crear el pipeline con AgentSession
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

    console.log('[Agent] Sesión iniciada. Esperando a que el participante se una...');
    const participant = await ctx.waitForParticipant();
    console.log(`[Agent] Participante conectado (${participant.identity}). Enviando saludo inicial...`);

    // Pausa breve para garantizar que el canal WebRTC esté listo
    await new Promise((r) => setTimeout(r, 600));
    await session.say(greeting);
  },
});

// Registrar el proceso del CLI para arrancar el worker
cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
  })
);
