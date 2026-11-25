import { APIStatusError, tts, voice } from '@livekit/agents';
import { Room, RoomEvent } from '@livekit/rtc-node';
import { isInterviewFarewellMessage } from './interview-turns.js';

export interface WatchdogOptions {
  session: voice.AgentSession;
  room?: Room | any; // LiveKit RTC Room
  isEs?: boolean;
  bvcEnabled?: boolean;
}

/**
 * ============================================================================
 * SERVICIO WATCHDOG DE SALUD Y RECUPERACIÓN BIDIRECCIONAL (SessionWatchdog)
 * ============================================================================
 * Monitorea continuamente la sesión de voz sin interrumpir el habla activa:
 *  1. Detección NO destructiva de atasco en 'thinking' (> 15s sin pasar a 'speaking').
 *  2. Recuperación controlada ante eventos de error transitorios del pipeline.
 *  3. Atención a pausas prolongadas del candidato (máx. 2 avisos consecutivos).
 *  4. Control bidireccional vía DataChannel ('interview-control' y 'agent-health').
 */
export class SessionWatchdog {
  private session: voice.AgentSession;
  private room?: any;
  private isEs: boolean;
  private bvcEnabled: boolean;

  private thinkingTimer: NodeJS.Timeout | null = null;
  private autoEndTimer: NodeJS.Timeout | null = null;
  private shutdownFallbackTimer: NodeJS.Timeout | null = null;
  private currentAgentState: string = 'initializing';
  private lastAssistantMessage = '';
  private hasUserTurn = false;
  private pendingFarewellMessage: string | null = null;
  private interviewCompleted = false;
  private voiceQuotaError = '';
  private lastRecoveryAt = 0;
  private consecutiveAwayPrompts = 0;
  private disposed = false;

  private static readonly THINKING_STALL_TIMEOUT_MS = 15000;
  private static readonly RECOVERY_COOLDOWN_MS = 20000;
  private static readonly MAX_CONSECUTIVE_AWAY_PROMPTS = 2;
  private static readonly FAREWELL_AUDIO_DRAIN_MS = 1500;
  private static readonly SHUTDOWN_FALLBACK_MS = 3500;

  constructor(options: WatchdogOptions) {
    this.session = options.session;
    this.room = options.room;
    this.isEs = options.isEs ?? true;
    this.bvcEnabled = options.bvcEnabled ?? true;

    this.attachSessionListeners();
    this.attachDataChannelListeners();
    console.log('[SessionWatchdog] ✅ Watchdog de salud y recuperación bidireccional activo.');
  }

  private clearThinkingTimer(): void {
    if (this.thinkingTimer) {
      clearTimeout(this.thinkingTimer);
      this.thinkingTimer = null;
    }
  }

  private clearAutoEndTimers(): void {
    if (this.autoEndTimer) {
      clearTimeout(this.autoEndTimer);
      this.autoEndTimer = null;
    }
    if (this.shutdownFallbackTimer) {
      clearTimeout(this.shutdownFallbackTimer);
      this.shutdownFallbackTimer = null;
    }
  }

  private scheduleAutoEndAfterPlayout(): void {
    if (this.disposed || this.interviewCompleted || !this.pendingFarewellMessage || this.autoEndTimer) {
      return;
    }
    const finalMessage = this.pendingFarewellMessage;
    console.log('[SessionWatchdog] 👋 Despedida final completada. Cerrando entrevista automáticamente...');
    this.autoEndTimer = setTimeout(() => {
      this.autoEndTimer = null;
      if (this.disposed || this.interviewCompleted) return;
      this.interviewCompleted = true;
      this.broadcastControl({
        action: 'interview_completed',
        type: 'interview_completed',
        reason: 'farewell',
        finalMessage,
        timestamp: Date.now(),
      });
      this.broadcastHealth(
        'ok',
        this.isEs ? 'Entrevista finalizada. Generando tu evaluación...' : 'Interview complete. Generating your report...'
      );
      this.shutdownFallbackTimer = setTimeout(() => {
        this.shutdownFallbackTimer = null;
        if (this.disposed) return;
        try {
          if (typeof this.session.shutdown === 'function') {
            this.session.shutdown({ drain: true });
          }
        } catch (err) {
          console.warn('[SessionWatchdog] Error cerrando sesión automáticamente:', err);
        }
      }, SessionWatchdog.SHUTDOWN_FALLBACK_MS);
    }, SessionWatchdog.FAREWELL_AUDIO_DRAIN_MS);
  }

  private attachSessionListeners(): void {
    // 1. Monitoreo de estado del agente y guarda no destructiva contra atasco en 'thinking'
    this.session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
      if (this.disposed) return;
      this.currentAgentState = ev.newState;
      this.clearThinkingTimer();

      if (ev.newState === 'thinking') {
        this.thinkingTimer = setTimeout(() => {
          if (this.disposed || this.currentAgentState !== 'thinking') return;
          this.attemptSoftRecovery('thinking_timeout');
        }, SessionWatchdog.THINKING_STALL_TIMEOUT_MS);
      }

      if (ev.newState === 'speaking') this.voiceQuotaError = '';
      if (ev.newState === 'listening' && this.pendingFarewellMessage) {
        this.scheduleAutoEndAfterPlayout();
      }
      if (!this.voiceQuotaError) this.broadcastHealth('ok', `Agent state: ${ev.newState}`);
    });

    // 2. Monitoreo de pausa prolongada del usuario (con tope de avisos consecutivos)
    this.session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => {
      if (this.disposed) return;

      if (ev.newState === 'speaking') {
        this.consecutiveAwayPrompts = 0;
      } else if (ev.newState === 'away') {
        if (this.consecutiveAwayPrompts >= SessionWatchdog.MAX_CONSECUTIVE_AWAY_PROMPTS) {
          return;
        }
        this.consecutiveAwayPrompts += 1;
        console.log(
          `[SessionWatchdog] Candidato en pausa prolongada (aviso ${this.consecutiveAwayPrompts}/${SessionWatchdog.MAX_CONSECUTIVE_AWAY_PROMPTS}).`
        );
        const prompt = this.isEs
          ? '¿Sigues ahí? Si deseas, puedo repetir la última pregunta cuando gustes.'
          : 'Are you still there? Let me know if you would like me to repeat the question.';
        try {
          this.session.say(prompt);
        } catch (err) {
          console.warn('[SessionWatchdog] No se pudo emitir aviso de pausa:', err);
        }
      }
    });

    // 3. Registro del último mensaje del evaluador para soportar 'repeat_last' y cierre automático tras despedida
    this.session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if (this.disposed) return;
      if (!('role' in ev.item)) return;
      if (ev.item.role === 'user') {
        this.hasUserTurn = true;
        return;
      }
      if (ev.item.role === 'assistant') {
        const text = (ev.item.content || [])
          .map((c: any) => (typeof c === 'string' ? c : c?.text || ''))
          .join(' ')
          .trim();
        if (text) {
          this.lastAssistantMessage = text;
          const wasInterrupted = Boolean((ev.item as any).interrupted);
          if (!wasInterrupted && this.hasUserTurn && isInterviewFarewellMessage(text)) {
            this.pendingFarewellMessage = text;
            if (this.currentAgentState === 'listening') {
              this.scheduleAutoEndAfterPlayout();
            }
          }
        }
      }
    });

    // 4. Manejo y recuperación suave de errores de LLM/TTS/STT
    this.session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      if (this.disposed) return;
      const errMsg = String((ev as any)?.error?.message || (ev as any)?.error || 'Error en sesión de voz');
      console.error('[SessionWatchdog] ❌ Evento de error capturado:', errMsg);
      if (ev.source instanceof tts.TTS && ev.error instanceof APIStatusError && ev.error.statusCode === 402) {
        this.voiceQuotaError = this.isEs
          ? 'La síntesis de voz agotó sus créditos. Revisa el saldo del proveedor de voz.'
          : 'Speech synthesis is out of credits. Check the voice provider balance.';
        this.broadcastHealth('error', this.voiceQuotaError);
        return;
      }

      if (this.currentAgentState !== 'speaking') {
        this.attemptSoftRecovery('pipeline_error', errMsg);
      } else {
        this.broadcastHealth('error', errMsg);
      }
    });

    // 5. Limpieza automática cuando la sesión termina
    this.session.on(voice.AgentSessionEventTypes.Close, () => {
      this.dispose();
    });
  }

  /**
   * Recuperación no destructiva: nunca interrumpe habla en curso, respeta cooldown
   * y notifica el estado al frontend para que el candidato vea retroalimentación clara.
   */
  private attemptSoftRecovery(reason: 'thinking_timeout' | 'pipeline_error', detail?: string): void {
    if (this.disposed || this.currentAgentState === 'speaking' || this.session.userState === 'speaking') return;

    const now = Date.now();
    if (now - this.lastRecoveryAt < SessionWatchdog.RECOVERY_COOLDOWN_MS) {
      this.broadcastHealth('error', detail || 'Reintentando conexión de voz...');
      return;
    }
    this.lastRecoveryAt = now;

    const uiMessage = this.isEs
      ? reason === 'thinking_timeout'
        ? 'Reanudando respuesta del evaluador...'
        : 'Recuperando enlace de voz IA...'
      : reason === 'thinking_timeout'
      ? 'Resuming interviewer response...'
      : 'Recovering AI voice link...';

    console.warn(`[SessionWatchdog] 🔄 Activando recuperación suave (${reason})...`);
    this.broadcastHealth('recovering', uiMessage);

    try {
      this.session.generateReply({
        instructions: this.isEs
          ? 'Retoma la pregunta en curso. Si quedó una explicación a medias, invita al candidato a continuarla. Avanza solo si ya terminó de responder.'
          : 'Resume the current question. If the candidate left an explanation unfinished, invite them to continue. Move on only if they finished answering.',
      });
    } catch (err) {
      console.warn('[SessionWatchdog] Error al invocar recuperación suave:', err);
      this.broadcastHealth('error', this.isEs ? 'Usa "Reanudar IA" para continuar.' : 'Click "Resume AI" to continue.');
    }
  }

  private attachDataChannelListeners(): void {
    if (!this.room) return;

    try {
      this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, _participant: any, _kind: any, topic?: string) => {
        if (this.disposed || topic !== 'interview-control') return;

        try {
          const str = new TextDecoder().decode(payload);
          const data = JSON.parse(str);
          const action = data.action || data.type;
          console.log('[SessionWatchdog] 📩 Comando recibido por DataChannel:', action);

          if (action === 'repeat_last') {
            this.broadcastHealth('recovering', this.isEs ? 'Repitiendo intervención...' : 'Repeating last prompt...');
            if (this.lastAssistantMessage) {
              console.log('[SessionWatchdog] Repitiendo última intervención del evaluador...');
              this.session.say(this.lastAssistantMessage, { allowInterruptions: true });
            } else {
              this.session.generateReply();
            }
          } else if (action === 'resume_turn') {
            if (this.session.userState === 'speaking') {
              this.broadcastHealth('ok', this.isEs ? 'Escuchando tu respuesta.' : 'Listening to your answer.');
              return;
            }
            if (this.session.agentState !== 'listening') return;
            this.broadcastHealth('recovering', this.isEs ? 'Reanudando evaluación...' : 'Resuming interview...');
            console.log('[SessionWatchdog] Forzando reanudación inmediata del turno...');
            this.session.generateReply({
              instructions: this.isEs
                ? 'El candidato pulsó el botón de reanudar. NO repitas textualmente tu última respuesta. En una sola frase natural y breve, indícale que sigues atento para escuchar su respuesta a la pregunta actual o pregúntale si prefiere pasar a la siguiente.'
                : 'The candidate clicked resume. Do NOT repeat your last message verbatim. In one brief, natural sentence, let them know you are listening for their answer to the current question or ask if they would like to move on to the next one.',
            });
          } else if (action === 'ping') {
            this.broadcastHealth('ok', 'Ping recibido');
          }
        } catch (e) {
          console.warn('[SessionWatchdog] Error procesando mensaje de DataChannel:', e);
        }
      });
    } catch (e) {
      console.warn('[SessionWatchdog] No se pudo vincular listener a Room:', e);
    }
  }

  private broadcastHealth(status: 'ok' | 'recovering' | 'error', message: string): void {
    if (this.disposed || !this.room || !this.room.localParticipant) return;

    try {
      const payload = JSON.stringify({
        status,
        message,
        bvcActive: this.bvcEnabled,
        timestamp: Date.now(),
      });
      const data = new TextEncoder().encode(payload);
      this.room.localParticipant.publishData(data, {
        reliable: true,
        topic: 'agent-health',
      });
    } catch {
      // Ignorar si el canal no está listo
    }
  }

  private broadcastControl(payloadObj: Record<string, unknown>): void {
    if (this.disposed || !this.room || !this.room.localParticipant) return;

    try {
      const data = new TextEncoder().encode(JSON.stringify(payloadObj));
      this.room.localParticipant.publishData(data, {
        reliable: true,
        topic: 'interview-control',
      });
    } catch (err) {
      console.warn('[SessionWatchdog] Error enviando evento de control por DataChannel:', err);
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.clearThinkingTimer();
    this.clearAutoEndTimers();
  }
}
