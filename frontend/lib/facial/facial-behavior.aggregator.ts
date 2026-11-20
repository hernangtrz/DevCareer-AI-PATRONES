import {
  FacialFrameSample,
  FacialTimelineBucket,
  FacialPeakEvent,
  FacialTelemetrySummary,
  LiveCoachingCue,
} from "./types";
import {
  TensionStrategy,
  GestureVolatilityStrategy,
  EyeContactStrategy,
  BlinkRateStrategy,
  PostureWarmthStrategy,
  IFacialMetricStrategy,
} from "./strategies/facial-metric.strategy";

/**
 * Agregador de telemetría conductual y gestor de eventos en vivo.
 * Responsable de calibrar la expresión neutra base, calcular buckets temporales,
 * detectar eventos pico y generar el resumen consolidado al finalizar la llamada.
 */
export class FacialBehaviorAggregator {
  private samples: FacialFrameSample[] = [];
  private baselineSamples: FacialFrameSample[] = [];
  private baselineBlendshapes: Record<string, number> = {};
  private isCalibrated = false;

  private timelineBuckets: FacialTimelineBucket[] = [];
  private peakEvents: FacialPeakEvent[] = [];

  private lastBucketSecond = -1;
  private lastAlertTimestamp = 0;
  private alertCooldownMs = 25000; // 25 s entre alertas en vivo (Anti-Ansiedad)

  // Instancias de estrategias
  private tensionStrategy: IFacialMetricStrategy = new TensionStrategy();
  private gestureStrategy: IFacialMetricStrategy = new GestureVolatilityStrategy();
  private eyeContactStrategy: IFacialMetricStrategy = new EyeContactStrategy();
  private blinkStrategy: IFacialMetricStrategy = new BlinkRateStrategy();
  private postureStrategy: IFacialMetricStrategy = new PostureWarmthStrategy();

  constructor(cooldownMs = 25000) {
    this.alertCooldownMs = cooldownMs;
  }

  /**
   * Agrega una muestra de frame capturada por el loop de visión.
   */
  public addSample(
    sample: FacialFrameSample,
    elapsedSeconds: number,
    currentTranscriptSnippet = ""
  ): LiveCoachingCue | null {
    this.samples.push(sample);

    // 1. Calibración de línea base durante los primeros ~3.5 s (aprox 20-25 frames con rostro)
    if (!this.isCalibrated) {
      if (sample.faceDetected) {
        this.baselineSamples.push(sample);
        if (this.baselineSamples.length >= 22) {
          this.computeBaseline();
        }
      }
      return null;
    }

    // 2. Comprobación y corte de bucket temporal cada 15 segundos
    const currentBucketIndex = Math.floor(elapsedSeconds / 15);
    if (currentBucketIndex > this.lastBucketSecond && elapsedSeconds >= 15) {
      this.closeTimelineBucket(currentBucketIndex * 15, sample.isSpeaking);
      this.lastBucketSecond = currentBucketIndex;
    }

    // 3. Evaluación de alertas y eventos pico en una ventana reciente (últimos 4-5 s)
    return this.evaluateLiveCues(sample, elapsedSeconds, currentTranscriptSnippet);
  }

  /**
   * Calcula el vector promedio de blendshapes en estado neutro.
   */
  private computeBaseline(): void {
    const accumulator: Record<string, number> = {};
    const count = this.baselineSamples.length;

    for (const s of this.baselineSamples) {
      for (const [key, val] of Object.entries(s.blendshapes)) {
        accumulator[key] = (accumulator[key] || 0) + val;
      }
    }

    for (const [key, total] of Object.entries(accumulator)) {
      this.baselineBlendshapes[key] = total / count;
    }

    this.isCalibrated = true;
  }

  /**
   * Genera un bucket de la línea de tiempo cada 15 segundos.
   */
  private closeTimelineBucket(second: number, isSpeaking: boolean): void {
    // Tomar las muestras correspondientes a los últimos 15 segundos
    const recentSamples = this.samples.slice(-100);
    if (recentSamples.length === 0) return;

    const ctx = {
      samples: recentSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      windowDurationSec: 15,
    };

    const tensionRes = this.tensionStrategy.evaluate(ctx);
    const eyeRes = this.eyeContactStrategy.evaluate(ctx);
    const gestureRes = this.gestureStrategy.evaluate(ctx);
    const postureRes = this.postureStrategy.evaluate(ctx);

    this.timelineBuckets.push({
      second,
      tension: Math.round((tensionRes.details.avgTensionIndex ?? 0.2) * 100),
      eyeContact: eyeRes.score,
      gestureIntensity: Math.min(100, Math.round(gestureRes.metricValue * 2.5)),
      warmth: postureRes.details.warmth ?? 70,
      speaker: isSpeaking ? "user" : "agent",
    });
  }

  /**
   * Evalúa si corresponde emitir una sugerencia sutil o registrar un evento pico.
   */
  private evaluateLiveCues(
    sample: FacialFrameSample,
    elapsedSeconds: number,
    snippet: string
  ): LiveCoachingCue | null {
    // Tomar los últimos ~30 frames (~4.5 segundos)
    const windowSamples = this.samples.slice(-30);
    if (windowSamples.length < 20) return null;

    const ctx = {
      samples: windowSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      windowDurationSec: 4.5,
    };

    const tensionRes = this.tensionStrategy.evaluate(ctx);
    const eyeRes = this.eyeContactStrategy.evaluate(ctx);
    const gestureRes = this.gestureStrategy.evaluate(ctx);

    // Registro de picos significativos (top 8 máx)
    if ((tensionRes.details.maxHighTensionStreakFrames ?? 0) >= 25 && this.peakEvents.length < 8) {
      const alreadyHasRecent = this.peakEvents.some(
        (e) => Math.abs(e.timestampSec - elapsedSeconds) < 20 && e.type === "high_tension"
      );
      if (!alreadyHasRecent) {
        this.peakEvents.push({
          timestampSec: elapsedSeconds,
          type: "high_tension",
          severity: "high",
          durationSec: 4,
          contextSnippet: snippet ? snippet.slice(-120) : undefined,
        });
      }
    }

    if ((eyeRes.details.maxProlongedAwayFrames ?? 0) >= 32 && this.peakEvents.length < 8) {
      const alreadyHasRecent = this.peakEvents.some(
        (e) => Math.abs(e.timestampSec - elapsedSeconds) < 20 && e.type === "low_eye_contact"
      );
      if (!alreadyHasRecent) {
        this.peakEvents.push({
          timestampSec: elapsedSeconds,
          type: "low_eye_contact",
          severity: "moderate",
          durationSec: 5,
          contextSnippet: snippet ? snippet.slice(-120) : undefined,
        });
      }
    }

    // Alertas en vivo para el HUD (con cooldown)
    const now = Date.now();
    if (now - this.lastAlertTimestamp < this.alertCooldownMs) {
      return null;
    }

    const potentialCue = tensionRes.alertCue || eyeRes.alertCue || gestureRes.alertCue;
    if (potentialCue) {
      this.lastAlertTimestamp = now;
      return {
        id: `cue-${now}`,
        type: potentialCue.type,
        text: potentialCue.text,
        severity: potentialCue.severity,
        timestamp: now,
      };
    }

    return null;
  }

  /**
   * Finaliza la sesión y consolida la telemetría completa.
   */
  public finalizeSummary(totalDurationSeconds: number): FacialTelemetrySummary {
    const validSamples = this.samples.filter((s) => s.faceDetected);
    const validFaceFrames = validSamples.length;
    const totalFrames = this.samples.length;
    const facePresenceRatio = totalFrames > 0 ? validFaceFrames / totalFrames : 0;

    const ctx = {
      samples: this.samples,
      baselineBlendshapes: this.baselineBlendshapes,
      windowDurationSec: totalDurationSeconds,
    };

    const tensionRes = this.tensionStrategy.evaluate(ctx);
    const gestureRes = this.gestureStrategy.evaluate(ctx);
    const eyeRes = this.eyeContactStrategy.evaluate(ctx);
    const blinkRes = this.blinkStrategy.evaluate(ctx);
    const postureRes = this.postureStrategy.evaluate(ctx);

    // Desglose de tensión hablando vs escuchando
    const speakingSamples = validSamples.filter((s) => s.isSpeaking);
    const listeningSamples = validSamples.filter((s) => !s.isSpeaking);

    const speakingTensionCtx = {
      samples: speakingSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      windowDurationSec: totalDurationSeconds / 2,
    };
    const listeningEyeCtx = {
      samples: listeningSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      windowDurationSec: totalDurationSeconds / 2,
    };

    const speakingTension = this.tensionStrategy.evaluate(speakingTensionCtx).details.avgTensionIndex || 0.2;
    const listeningEyeContact = this.eyeContactStrategy.evaluate(listeningEyeCtx).score || 85;

    // Puntuación global de presencia ejecutiva (0..100)
    const overallPresence = Math.round(
      eyeRes.score * 0.25 +
      tensionRes.score * 0.25 +
      gestureRes.score * 0.20 +
      (postureRes.details.postureStability ?? 70) * 0.15 +
      (postureRes.details.warmth ?? 70) * 0.15
    );

    return {
      enabled: true,
      durationSeconds: totalDurationSeconds,
      sampledFrames: totalFrames,
      validFaceFrames,
      facePresenceRatio: Math.round(facePresenceRatio * 100) / 100,
      calibrated: this.isCalibrated,
      scores: {
        overallPresence,
        eyeContact: eyeRes.score,
        composure: tensionRes.score,
        gestureBalance: gestureRes.score,
        postureStability: postureRes.details.postureStability ?? 70,
        warmth: postureRes.details.warmth ?? 70,
      },
      indicators: {
        avgTensionIndex: tensionRes.details.avgTensionIndex ?? 0.2,
        gestureProfile: gestureRes.details.gestureProfile || "natural",
        blinkRatePerMin: blinkRes.metricValue,
        headMovementVolatility: gestureRes.details.headMovementVolatility || 2.5,
        speakingVsListening: {
          speakingTensionAvg: Math.round(speakingTension * 100) / 100,
          listeningEyeContactAvg: listeningEyeContact,
        },
      },
      timeline: this.timelineBuckets,
      peakEvents: this.peakEvents,
    };
  }

  public getCalibrated(): boolean {
    return this.isCalibrated;
  }
}
