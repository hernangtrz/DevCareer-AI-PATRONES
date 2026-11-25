import { cli, WorkerOptions, defineAgent, type JobContext, type JobProcess, voice } from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { VoiceAgentStrategyResolver, GreetingContext } from './strategies/voice-agent.strategy.js';
import { VoicePipelineFactory } from './factories/voice-pipeline.factory.js';
import { SessionWatchdog } from './services/session-watchdog.js';
import { InterviewTurnDetector, InterviewVoiceAgent } from './services/interview-turns.js';

dotenv.config();

/**
 * Opciones de Silero VAD en MILISEGUNDOS (unidad oficial en @livekit/agents-plugin-silero Node.js).
 * - activationThreshold: 0.38 asegura detección confiable incluso con voz suave o micrófono de laptop.
 * - minSpeechDuration: 150ms captura de inmediato respuestas breves como "Sí, listo".
 * - minSilenceDuration: 850ms evita cortar comas naturales sin añadir esperas muertas.
 * - prefixPaddingDuration: 300ms preserva la primera sílaba del candidato.
 */
const VAD_OPTIONS = {
  activationThreshold: 0.38,
  minSpeechDuration: 150,
  minSilenceDuration: 850,
  prefixPaddingDuration: 300,
};

function logTs(): string {
  return new Date().toISOString().slice(11, 23);
}

/**
 * Limpia y normaliza el título de la vacante para síntesis de voz natural,
 * evitando que la IA lea texto administrativo como 'Buscamos un...' o '(Refuerzo ATS)'.
 */
function sanitizeRoleForSpeech(rawRole: string): string {
  if (!rawRole) return 'Desarrollador de Software';
  const cleaned = rawRole
    .replace(/^entrevista\s+(de\s+|para\s+)?/i, '')
    .replace(/^buscamos\s+(un|una)\s+/i, '')
    .replace(/\s*\(refuerzo\s+ats\)/gi, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || rawRole;
}

/**
 * Lee la preferencia de aislamiento de voz (BVC) desde los metadatos del token del candidato.
 */
function parseVoiceIsolationMetadata(metadata?: string): boolean {
  if (!metadata) return true;
  try {
    const parsed = JSON.parse(metadata);
    if (typeof parsed?.voiceIsolation === 'boolean') {
      return parsed.voiceIsolation;
    }
  } catch {
    // Si el metadata no es JSON válido, mantener BVC activo por defecto
  }
  return true;
}

export default defineAgent({
  // IMPORTANTE: Cargar Silero VAD dentro de prewarm() y NO con top-level await.
  // Un top-level await bloquea import(agent.ts) por >10s en Windows, haciendo que
  // SupervisedProc.initialize() expire a los 10s, no inicie pingInterval, y que el
  // proceso hijo se auto-elimine con ORPHANED_TIMEOUT (15s) a mitad del saludo.
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load(VAD_OPTIONS);
  },
  entry: async (ctx: JobContext) => {
    const vad =
      (ctx.proc.userData.vad as silero.VAD) || (await silero.VAD.load(VAD_OPTIONS));

    console.log(`[Agent] Conectando a la sala: ${ctx.job.room?.name || 'desconocida'}`);
    await ctx.connect();
    console.log(`[Agent] Conectado a LiveKit.`);

    // Esperar al participante antes de iniciar la sesión para leer sus preferencias (BVC)
    // y garantizar que el saludo no arranque antes de que el candidato esté listo.
    const participant =
      ctx.room.remoteParticipants.size > 0
        ? Array.from(ctx.room.remoteParticipants.values())[0]
        : await ctx.waitForParticipant();

    const voiceIsolationRequested = parseVoiceIsolationMetadata(participant?.metadata);
    console.log(
      `[Agent] Participante listo (${participant?.identity || 'desconocido'}). Aislamiento BVC solicitado=${voiceIsolationRequested}.`
    );

    // El módulo nativo @livekit/noise-cancellation-node ya quedó registrado en top-level antes de ctx.connect()
    const noiseCancellation = await VoicePipelineFactory.createNoiseCancellation(voiceIsolationRequested);

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

    const spokenRole = sanitizeRoleForSpeech(role);
    const greetingContext: GreetingContext = {
      interviewerName: config.name,
      role: spokenRole,
      company,
      techstack,
    };

    const greeting = strategy.getGreeting(config.name, greetingContext);
    console.log(`[Agent] Saludo inicial personalizado preparado:\n"${greeting}"`);

    // Generar instrucciones polimórficamente sin condicionales de idioma
    const instructions = strategy.getInstructions(spokenRole, questionsList, greetingContext);

    // Crear pipeline resiliente tolerante a fallos transitorios y falsas interrupciones
    const detector = new InterviewTurnDetector(config.language);
    const session = VoicePipelineFactory.createSession(config, vad, detector);

    // Logging de eventos para monitoreo y depuración en tiempo real
    session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      console.error(`[${logTs()}] [Agent] Error en sesión de voz:`, ev);
    });

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (ev.transcript?.trim()) {
        console.log(`[${logTs()}] [Agent] Transcripción (${ev.isFinal ? 'FINAL' : 'parcial'}): "${ev.transcript.trim()}"`);
      }
    });

    session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => {
      console.log(`[${logTs()}] [Agent] Estado del candidato: ${ev.oldState} -> ${ev.newState}`);
    });

    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
      console.log(`[${logTs()}] [Agent] Estado del agente: ${ev.oldState} -> ${ev.newState}`);
    });

    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if ('role' in ev.item) {
        console.log(`[${logTs()}] [Agent] Historial [${ev.item.role}]: ${(ev.item.content || []).map((c: any) => typeof c === 'string' ? c : c?.text || '').join(' ')}`);
      }
    });

    // Vincular Watchdog de Salud, recuperación bidireccional y DataChannel
    const watchdog = new SessionWatchdog({
      session,
      room: ctx.room,
      isEs: config.language === 'es',
      bvcEnabled: !!noiseCancellation,
    });

    session.on(voice.AgentSessionEventTypes.Close, (ev) => {
      console.log(`[Agent] Sesión cerrada (razón: ${ev.reason}).`);
      watchdog.dispose();
    });

    const agent = new InterviewVoiceAgent({
      instructions,
      tools: {},
    }, detector);

    // Iniciar la sesión vinculada a la sala de LiveKit con cancelación de ruido BVC (según toggle)
    // y cola de salida compacta (300ms en lugar de 1000ms) para pasar a 'listening' casi de inmediato.
    await session.start({
      agent,
      room: ctx.room,
      inputOptions: {
        noiseCancellation,
      },
      outputOptions: {
        queueSizeMs: 300,
      },
    });

    console.log('[Agent] Sesión iniciada. Enviando saludo inicial...');

    // Breve pausa para estabilizar la suscripción WebRTC.
    // allowInterruptions=true (resguardado por aecWarmupDuration y minWords=2) evita
    // descartar la respuesta del candidato si contesta apenas finaliza el saludo.
    await new Promise((r) => setTimeout(r, 200));
    await session.say(greeting, { allowInterruptions: true });
  },
});

// Registrar el proceso del CLI para arrancar el worker con pre-warming y timeout de inicialización extendido (60s)
cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    initializeProcessTimeout: 60 * 1000,
    numIdleProcesses: 1,
  })
);
