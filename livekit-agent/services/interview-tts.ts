import { APIConnectionError, APIStatusError, AudioByteStream, tts, type APIConnectOptions } from '@livekit/agents';
import type { AudioFrame } from '@livekit/rtc-node';
import { randomUUID } from 'node:crypto';
import type { VoiceConfig } from '../strategies/voice-agent.strategy.js';

const SAMPLE_RATE = 16000;
const SAMPLES_PER_FRAME = SAMPLE_RATE / 50;

// Una instancia por entrevista. Un 402 cambia la voz de las frases pendientes
// y siguientes sin regenerar la pregunta ni volver a reproducir frases anteriores.
export class InterviewTTS extends tts.TTS {
  label = 'InterviewTTS';

  constructor(
    private readonly config: VoiceConfig,
    private cartesiaKey: string | undefined,
    private readonly deepgramKey: string | undefined,
  ) {
    super(SAMPLE_RATE, 1, { streaming: false });
  }

  override synthesize(text: string, options?: APIConnectOptions, signal?: AbortSignal) {
    return new InterviewSentence(text, this, options, signal);
  }

  override stream(): never {
    throw new Error('InterviewTTS requiere el adaptador de frases de LiveKit.');
  }

  async requestAudio(text: string, signal: AbortSignal): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };
    let response: Response | undefined;
    let provider = 'Cartesia';
    if (this.cartesiaKey) {
      response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST', signal,
        headers: { ...headers, 'X-API-Key': this.cartesiaKey, 'Cartesia-Version': '2025-04-16' },
        body: JSON.stringify({
          model_id: 'sonic-2', transcript: text, language: this.config.language,
          voice: { mode: 'id', id: this.config.voice },
          output_format: { container: 'raw', encoding: 'pcm_s16le', sample_rate: SAMPLE_RATE },
        }),
      });
      if (response.status === 402 && this.deepgramKey) {
        if (this.cartesiaKey) console.warn('[TTS] Cartesia sin créditos (402). Se usará Deepgram en esta entrevista.');
        this.cartesiaKey = undefined;
        await response.body?.cancel();
        response = undefined;
      }
    }

    if (!response && this.deepgramKey) {
      provider = 'Deepgram';
      const model = this.config.language === 'es'
        ? (this.config.name === 'Catalina' ? 'aura-2-celeste-es' : 'aura-2-sirio-es')
        : (this.config.name === 'Katie' ? 'aura-2-thalia-en' : 'aura-2-orion-en');
      const params = new URLSearchParams({
        model, encoding: 'linear16', sample_rate: String(SAMPLE_RATE), container: 'none',
      });
      response = await fetch(`https://api.deepgram.com/v1/speak?${params}`, {
        method: 'POST', signal, headers: { ...headers, Authorization: `Token ${this.deepgramKey}` },
        body: JSON.stringify({ text }),
      });
    }
    if (!response) throw new Error('Faltan credenciales para la síntesis de voz.');
    if (!response.ok) {
      await response.body?.cancel();
      throw new APIStatusError({
        message: `${provider} TTS devolvió HTTP ${response.status}`,
        options: { statusCode: response.status },
      });
    }
    if (response.headers.get('content-type')?.includes('json')) {
      await response.body?.cancel();
      throw new Error(`${provider} devolvió JSON en lugar de audio.`);
    }
    if (!response.body) throw new Error(`${provider} devolvió una respuesta sin audio.`);
    return response;
  }
}

class InterviewSentence extends tts.ChunkedStream {
  label = 'InterviewSentence';
  private attempts = 0;

  constructor(
    text: string,
    private readonly source: InterviewTTS,
    private readonly options?: APIConnectOptions,
    signal?: AbortSignal,
  ) {
    super(text, source, options, signal);
  }

  protected async run(): Promise<void> {
    this.attempts++;
    let sentAudio = false;
    const signal = AbortSignal.any([this.abortSignal, AbortSignal.timeout(this.options?.timeoutMs ?? 12000)]);
    try {
      const response = await this.source.requestAudio(this.inputText, signal);
      const requestId = randomUUID();
      const pcm = new AudioByteStream(SAMPLE_RATE, 1, SAMPLES_PER_FRAME);
      let bytes = 0;
      let lastFrame: AudioFrame | undefined;
      for await (const chunk of response.body!) {
        bytes += chunk.byteLength;
        for (const frame of pcm.write(chunk)) {
          if (lastFrame) {
            this.queue.put({ requestId, segmentId: requestId, frame: lastFrame, final: false });
            sentAudio = true;
          }
          lastFrame = frame;
        }
      }
      if (!bytes || bytes % 2) throw new Error('La síntesis devolvió audio PCM vacío o incompleto.');
      const tail = pcm.flush()[0];
      if (tail?.samplesPerChannel) {
        if (lastFrame) this.queue.put({ requestId, segmentId: requestId, frame: lastFrame, final: false });
        lastFrame = tail;
      }
      if (lastFrame) this.queue.put({ requestId, segmentId: requestId, frame: lastFrame, final: true });
    } catch (cause) {
      if (this.abortSignal.aborted) return;
      const error = cause instanceof APIStatusError ? cause : new APIConnectionError({ message: String(cause) });
      if (!sentAudio && error.retryable && this.attempts <= (this.options?.maxRetry ?? 0)) throw error;
      // ChunkedStream 1.4.5 lanza el último error en una tarea sin consumidor.
      // Informarlo por el canal de la sesión también permite seguir transcribiendo.
      this.source.emit('error', { type: 'tts_error', label: this.label, error, timestamp: Date.now(), recoverable: false });
    }
  }
}
