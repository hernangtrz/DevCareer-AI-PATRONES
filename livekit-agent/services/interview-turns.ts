import { llm, voice } from '@livekit/agents';
import { ReadableStream, TransformStream } from 'node:stream/web';

// Se evalúa la transcripción acumulada del turno, que puede contener varios finales de STT.
// Se conservan los acentos para distinguir «no sé» del fragmento «no se…».
const spanishEndings = [
  /(?:^| )(?:el|la|los|las|un|una|de|del|al|en|con|para|por|mediante|y|o|que|porque|pero|aunque|entonces|se)$/,
  /(?:^| )(?:por ejemplo|como son|son los siguientes|son las siguientes|lo que hice fue|lo que haría sería|por decirlo así no sé)$/,
  // Una enumeración anunciada sigue abierta aunque el STT cambie el verbo, p. ej. «aplico» por «aplicó».
  /^(?:el|la|los|las|mis?) (?:principios?|patrón|patrones|pasos?|ejemplos?|razón|razones|motivos?|decisión|decisiones|herramientas?|criterios?)(?: (?:claves?|principal(?:es)?|técnic[oa]s?|de diseño))? que (?:(?:yo|se) )?\p{L}+$/u,
  /^(?:el|la|los|las|lo|mis?) (?:[\p{L}\d]+ ){0,6}que (?:(?:yo|se) )?(?:(?:aplic|us|utiliz|emple)(?:o|as?|an)|haría|elegí)$/u,
  /(?:^| )(?:déjame (?:pensar|terminar)|dame un (?:momento|segundo)|necesito (?:un momento|pensarlo)|no he terminado)$/,
  /^(?:bueno|a ver|este)$/,
  /(?:^| )(?:eh+|em+|mm+)$/,
];
const englishEndings = [
  /(?:^| )(?:a|an|the|and|or|but|because|although|with|of|to|such as|for example|which are|what i did was)$/,
  /^(?:the|my) (?:[a-z\d]+ ){1,6}(?:that )?i (?:use|apply|chose|would choose)$/,
  /(?:^| )(?:let me (?:think|finish)|give me a (?:moment|second)|i need a (?:moment|second)|i m not finished)$/,
  /^(?:well|let me see)$/,
  /(?:^| )(?:uh+|um+|hm+)$/,
];

const FAREWELL_DASHBOARD_PATTERN =
  /(?:dashboard|panel de (?:anal[ií]tica|resultados)|reporte de (?:evaluaci[oó]n|feedback)|feedback report|an[aá]lisis (?:detallado )?de tu desempe[nñ]o)/i;
const FAREWELL_CLOSING_CONTEXT_PATTERN =
  /(?:gracias|conclu|finaliz|termina|pronto|[eé]xito|despedi|participaci[oó]n|thank|conclud|finish|luck|goodbye|see you)/i;
const EXPLICIT_FAREWELL_PATTERN =
  /(?:¡?\s*hasta pronto\s*!?|¡?\s*hasta luego\s*!?|¡?\s*nos vemos pronto\s*!?|con esto (?:concluimos|finalizamos|terminamos)|hemos (?:concluido|finalizado|terminado) (?:la|esta|tu) entrevista|damos por (?:finalizada|terminada|concluida) (?:la|esta|tu) entrevista|muchas gracias por tu tiempo(?: y participaci[oó]n)? en esta entrevista|gracias por tu tiempo dedicado a esta entrevista|that concludes (?:our|this|the) (?:technical )?interview|we(?:'ve| have) (?:completed|finished) (?:our|this|the) interview|thank you(?: so much)? for your time(?: and participation)?(?: today)? in this interview|best of luck and (?:goodbye|see you soon))/i;

/**
 * Detecta si la intervención final del evaluador corresponde a la despedida de cierre
 * de la entrevista (sin preguntas pendientes), tanto en español como en inglés.
 */
export function isInterviewFarewellMessage(text: string): boolean {
  const cleaned = text.trim();
  if (!cleaned) return false;
  // Si contiene una pregunta, la entrevista sigue activa.
  if (/[¿?]/.test(cleaned)) return false;
  if (EXPLICIT_FAREWELL_PATTERN.test(cleaned)) return true;
  return FAREWELL_DASHBOARD_PATTERN.test(cleaned) && FAREWELL_CLOSING_CONTEXT_PATTERN.test(cleaned);
}

export class InterviewTurnDetector {
  readonly model = 'interview-turn-rules';
  readonly provider = 'DevCareer';

  constructor(private readonly language: string) {}

  get continuationPrompt(): string {
    return this.language === 'es' ? 'Tómate tu tiempo, te escucho.' : 'Take your time, I’m listening.';
  }

  isUnfinished(chatCtx: llm.ChatContext): boolean {
    const last = chatCtx.items.at(-1);
    if (last?.type !== 'message' || last.role !== 'user' || !last.textContent) return false;
    const sentences = last.textContent.toLowerCase().normalize('NFC').split(/[.!?…:\n]+/u);
    const ending = sentences.map((s) => s.replace(/[^\p{L}\p{N}]+/gu, ' ').trim()).filter(Boolean).at(-1) ?? '';
    const rules = this.language === 'es' ? spanishEndings : englishEndings;
    return rules.some((rule) => rule.test(ending));
  }

  async supportsLanguage(language?: string): Promise<boolean> {
    return !language || language.split('-')[0] === this.language;
  }

  async unlikelyThreshold(): Promise<number> { return 0.5; }

  async predictEndOfTurn(chatCtx: llm.ChatContext): Promise<number> {
    // LiveKit elige maxDelay para 0 y minDelay para 1; un nuevo inicio de voz cancela la espera.
    return this.isUnfinished(chatCtx) ? 0 : 1;
  }
}

export class InterviewVoiceAgent extends voice.Agent {
  private static readonly MAX_HISTORY_ITEMS = 10;

  constructor(options: ConstructorParameters<typeof voice.Agent>[0], private readonly detector: InterviewTurnDetector) {
    super(options);
  }

  override async onUserTurnCompleted(turnCtx: llm.ChatContext, _newMessage: llm.ChatMessage): Promise<void> {
    if (turnCtx.items.length > InterviewVoiceAgent.MAX_HISTORY_ITEMS + 2) {
      turnCtx.truncate(InterviewVoiceAgent.MAX_HISTORY_ITEMS);
      await this.updateChatCtx(turnCtx);
      console.log(`[InterviewVoiceAgent] 🧹 Contexto LLM compactado a ${turnCtx.items.length} ítems para proteger cuota TPM.`);
    }
  }

  override async llmNode(...args: Parameters<voice.Agent['llmNode']>) {
    const prompt = this.detector.continuationPrompt;
    if (this.detector.isUnfinished(args[0])) {
      return ReadableStream.from([prompt]);
    }
    const output = await super.llmNode(...args);
    if (!output) return null;
    // Algunos modelos devuelven solo el fin de secuencia para ceder la palabra.
    // flush se ejecuta en un cierre normal, nunca al cancelar la réplica.
    let hasReply = false;
    return output.pipeThrough(new TransformStream<llm.ChatChunk | string, llm.ChatChunk | string>({
      transform(chunk, controller) {
        const content = typeof chunk === 'string' ? chunk : chunk.delta?.content;
        if (content?.trim() || (typeof chunk !== 'string' && chunk.delta?.toolCalls?.length)) hasReply = true;
        controller.enqueue(chunk);
      },
      flush(controller) {
        if (!hasReply) controller.enqueue(prompt);
      },
    }));
  }
}
