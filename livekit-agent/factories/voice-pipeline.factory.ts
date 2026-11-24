import { llm, tts, tokenize, voice, type VAD } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import { InterviewTTS } from '../services/interview-tts.js';
import { InterviewTurnDetector } from '../services/interview-turns.js';
import * as openai from '@livekit/agents-plugin-openai';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { VoiceConfig } from '../strategies/voice-agent.strategy.js';

// Deepgram puede confirmar un segmento mientras LiveKit sigue esperando el resto del turno.
export class InterviewSTT extends deepgram.STT {
  private activeStream?: deepgram.SpeechStream;

  override stream(...args: Parameters<deepgram.STT['stream']>) {
    this.activeStream = super.stream(...args);
    return this.activeStream;
  }

  finalizeSegment(): void {
    try {
      this.activeStream?.flush();
    } catch (error) {
      // La pista puede cerrarse a la vez que llega el último evento de Silero.
      if (!(error instanceof Error && /^(Input|Stream) is closed$/.test(error.message))) throw error;
    }
  }

  attachTo(session: voice.AgentSession): void {
    const events = voice.AgentSessionEventTypes;
    let pendingInterim = false;
    let pendingReply: ReturnType<voice.AgentSession['generateReply']> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const cancelRetry = () => {
      clearTimeout(retry);
      retry = undefined;
    };
    const retryIfPending = () => {
      if (retry || !pendingInterim || session.userState === 'speaking') return;
      retry = setTimeout(() => {
        if (pendingInterim && session.userState === 'listening') this.finalizeSegment();
        // Se rearma cuando llega otra intervención o una confirmación.
      }, 1600);
    };
    session.on(events.UserStateChanged, (ev) => {
      if (ev.newState === 'speaking') cancelRetry();
      if (ev.oldState === 'speaking' && ev.newState === 'listening') {
        this.finalizeSegment();
        retryIfPending();
      }
    });
    session.on(events.SpeechCreated, ({ source, speechHandle }) => {
      if (source !== 'generate_reply' || !speechHandle.allowInterruptions) return;
      pendingReply = speechHandle;
      speechHandle.addDoneCallback(() => {
        if (pendingReply === speechHandle) pendingReply = undefined;
      });
    });
    session.on(events.UserInputTranscribed, (ev) => {
      pendingInterim = !ev.isFinal && Boolean(ev.transcript.trim());
      // El SDK consulta el parcial anterior durante este evento. La primera palabra
      // nueva ya permite retirar una respuesta que todavía no ha empezado a sonar.
      if (ev.transcript.trim() && session.userState === 'speaking' && session.agentState === 'thinking' &&
          pendingReply && !pendingReply.interrupted && !pendingReply.done()) {
        pendingReply.interrupt();
      }
      if (pendingInterim) retryIfPending();
      else cancelRetry();
    });
    session.on(events.Close, cancelRetry);
  }
}

/**
 * ============================================================================
 * PATRÓN FACTORY + CHAIN OF RESPONSIBILITY (GoF): VoicePipelineFactory
 * ============================================================================
 * Centraliza la creación resiliente de los componentes de audio de LiveKit:
 *  - Cancelación de Ruido y Aislamiento de Voz Primaria (Krisp BVC).
 *  - FallbackAdapter de 3 niveles para LLM con cuotas independientes:
 *      1. Groq qwen/qwen3.8-27b (8,000 TPM, <300ms, sin overhead de reasoning)
 *      2. Groq openai/gpt-oss-20b (8,000 TPM independientes en Groq)
 *      3. Google Gemini gemini-3.5-flash-lite (proveedor independiente verificado)
 *  - Deepgram STT (nova-2-general con endpointing 350ms para frases completas).
 *  - Cartesia TTS por frase, con Deepgram como respaldo si se agotan los créditos.
 */
export class VoicePipelineFactory {
  public static createSession(config: VoiceConfig, vad: VAD, detector = new InterviewTurnDetector(config.language)): voice.AgentSession {
    const transcription = this.createSTT(config);
    const session = new voice.AgentSession({
      vad,
      stt: transcription,
      llm: this.createLLM(),
      tts: this.createTTS(config),
      aecWarmupDuration: 1500,
      userAwayTimeout: 35,
      ttsReadIdleTimeout: 15000,
      forwardAudioIdleTimeout: 15000,
      connOptions: {
        maxUnrecoverableErrors: 8,
        llmConnOptions: {
          maxRetry: 1,
          timeoutMs: 12000,
          retryIntervalMs: 500,
        },
        ttsConnOptions: {
          maxRetry: 2,
          timeoutMs: 12000,
          retryIntervalMs: 500,
        },
      },
      turnHandling: {
        turnDetection: detector,
        endpointing: {
          mode: 'fixed',
          // LiveKit cuenta desde la última voz detectada, incluido el silencio de Silero.
          minDelay: 5000,
          maxDelay: 10000,
        },
        interruption: {
          enabled: true,
          mode: 'vad',
          minDuration: 600,
          minWords: 1,
          // CRÍTICO: Mantener resumeFalseInterruption en false para evitar deadlock interno
          // de @livekit/agents@1.4.5 (audioOutput.pause() con pushedDuration=0 bloquea waitForPlayout() para siempre).
          resumeFalseInterruption: false,
          discardAudioIfUninterruptible: true,
        },
        preemptiveGeneration: {
          enabled: false,
        },
      },
    });
    transcription.attachTo(session);
    return session;
  }

  /**
   * Crea el procesador de cancelación de ruido y voces de fondo (BVC).
   * Nota importante: @livekit/noise-cancellation-node se importa a nivel de módulo
   * para registrar el AudioFilter en Rust FFI ANTES de ctx.connect() y evitar code=209.
   */
  public static async createNoiseCancellation(enabled: boolean = true) {
    if (!enabled || process.env.ENABLE_BVC === 'false') {
      console.log('[VoicePipelineFactory] BVC desactivado por configuración o preferencia del candidato.');
      return undefined;
    }

    try {
      console.log('[VoicePipelineFactory] ✅ LiveKit Krisp BVC (Background Voice Cancellation) inicializado.');
      return BackgroundVoiceCancellation();
    } catch (err) {
      console.warn('[VoicePipelineFactory] ⚠️ No se pudo inicializar BVC nativo, usando audio estándar:', err);
      return undefined;
    }
  }

  /**
   * Crea la cadena resiliente de LLM con 3 niveles y cuotas TPM independientes.
   * Evita congelamientos por límite de 8,000 TPM de Groq o errores 503 de modelos sobrecargados.
   */
  public static createLLM(): llm.LLM {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    const llms: llm.LLM[] = [];
    const chainLabels: string[] = [];

    // 1. Primario: Groq Qwen 3.8-27B (rápido, sin tokens de razonamiento oculto)
    if (groqKey) {
      const primaryGroqModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
      llms.push(
        new openai.LLM({
          model: primaryGroqModel,
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: groqKey,
          temperature: 0.7,
          maxCompletionTokens: 220,
        })
      );
      chainLabels.push(`Groq(${primaryGroqModel})`);

      // 2. Respaldo en Groq con bucket TPM independiente (8,000 TPM adicionales)
      const fallbackGroqModel = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';
      if (fallbackGroqModel && fallbackGroqModel !== primaryGroqModel) {
        llms.push(
          new openai.LLM({
            model: fallbackGroqModel,
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: groqKey,
            temperature: 0.7,
            maxCompletionTokens: 600,
          })
        );
        chainLabels.push(`Groq(${fallbackGroqModel})`);
      }
    }

    // 3. Respaldo Multi-Cloud: Google Gemini 3.5 Flash Lite (verificado 200 OK y baja latencia)
    if (geminiKey) {
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
      llms.push(
        new openai.LLM({
          model: geminiModel,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          apiKey: geminiKey,
          temperature: 0.7,
          maxCompletionTokens: 220,
        })
      );
      chainLabels.push(`Gemini(${geminiModel})`);
    }

    if (llms.length === 0) {
      throw new Error('No hay claves API de LLM configuradas (GROQ_API_KEY o GOOGLE_GENERATIVE_AI_API_KEY).');
    }

    if (llms.length === 1) {
      console.log(`[VoicePipelineFactory] ✅ LLM único configurado: ${chainLabels[0]}.`);
      return llms[0];
    }

    console.log(`[VoicePipelineFactory] ✅ Cadena LLM Fallback: ${chainLabels.join(' -> ')}.`);
    return new llm.FallbackAdapter({
      llms,
      attemptTimeout: 10.0,
      maxRetryPerLLM: 1,
      retryInterval: 0.4,
    });
  }

  /**
   * Crea el motor STT (reconocimiento de voz) con Deepgram nova-2-general.
   * endpointing=350ms evita fragmentar frases naturales del candidato en segmentos cortados.
   */
  public static createSTT(config: VoiceConfig): InterviewSTT {
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramKey) {
      throw new Error('DEEPGRAM_API_KEY no está configurada.');
    }

    return new InterviewSTT({
      model: 'nova-2-general',
      language: config.language,
      endpointing: 350,
      apiKey: deepgramKey,
    });
  }

  /**
   * El adaptador conserva el orden del audio y sincroniza el texto por frase.
   */
  public static createTTS(config: VoiceConfig): tts.TTS {
    const cartesiaKey = process.env.CARTESIA_API_KEY;
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (!cartesiaKey && !deepgramKey) throw new Error('Faltan credenciales para la síntesis de voz.');
    return new tts.StreamAdapter(
      new InterviewTTS(config, cartesiaKey, deepgramKey),
      new tokenize.basic.SentenceTokenizer(),
    );
  }
}
