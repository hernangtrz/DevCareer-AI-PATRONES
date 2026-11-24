import {
  FacialFrameSample,
  FacialTimelineBucket,
  FacialPeakEvent,
  FacialTelemetrySummary,
  LiveCoachingCue,
  FacialBaselineCalibration,
  LiveFacialSnapshot,
  HeadEulerAngles,
} from "./types";
import {
  TensionStrategy,
  GestureVolatilityStrategy,
  EyeContactStrategy,
  BlinkRateStrategy,
  PostureWarmthStrategy,
  IFacialMetricStrategy,
} from "./strategies/facial-metric.strategy";
import { Vector3OneEuroFilter, OneEuroFilter, computeMedian } from "./signal-filters";

/**
 * ============================================================================
 * AGREGADOR DE TELEMETRÍA CONDUCTUAL Y EVENTOS EN VIVO (DevCareer AI)
 * ============================================================================
 * Responsable de:
 *  - Suavizado cinemático con filtro One-Euro en tiempo real.
 *  - Calibración matemática por mediana (rostro + ángulo de cámara + iris).
 *  - Cálculo O(1) de snapshots en vivo sobre ventana deslizante de 5s.
 *  - Generación de buckets temporales cada 10s y detección de eventos pico.
 *  - Consolidación del resumen final para el LLM y reportes Bridge.
 */
export class FacialBehaviorAggregator {
  private samples: FacialFrameSample[] = [];
  private baselineSamples: FacialFrameSample[] = [];
  private baselineBlendshapes: Record<string, number> = {};
  private baselineCalibration: FacialBaselineCalibration | null = null;
  private isCalibrated = false;

  private timelineBuckets: FacialTimelineBucket[] = [];
  private peakEvents: FacialPeakEvent[] = [];

  private lastBucketSecond = -1;
  private lastAlertTimestamp = 0;
  private alertCooldownMs = 20000; // 20s entre alertas HUD para evitar sobrecargar al candidato

  // Filtros One-Euro para reducción de ruido de alta frecuencia
  private headAngleFilter = new Vector3OneEuroFilter({ minCutoff: 1.2, beta: 0.03, dCutoff: 1.0 });
  private centroidFilterX = new OneEuroFilter({ minCutoff: 1.0, beta: 0.02 });
  private centroidFilterY = new OneEuroFilter({ minCutoff: 1.0, beta: 0.02 });

  // Estrategias GoF
  private tensionStrategy: IFacialMetricStrategy = new TensionStrategy();
  private gestureStrategy: IFacialMetricStrategy = new GestureVolatilityStrategy();
  private eyeContactStrategy: IFacialMetricStrategy = new EyeContactStrategy();
  private blinkStrategy: IFacialMetricStrategy = new BlinkRateStrategy();
  private postureStrategy: IFacialMetricStrategy = new PostureWarmthStrategy();

  constructor(cooldownMs = 20000) {
    this.alertCooldownMs = cooldownMs;
  }

  /**
   * Agrega y filtra una muestra de frame capturada por el loop de visión.
   */
  public addSample(
    rawSample: FacialFrameSample,
    elapsedSeconds: number,
    currentTranscriptSnippet = ""
  ): LiveCoachingCue | null {
    // 1. Suavizado cinemático One-Euro
    const filteredAngles = this.headAngleFilter.filter(
      rawSample.headAngles.yaw,
      rawSample.headAngles.pitch,
      rawSample.headAngles.roll,
      rawSample.timestamp
    );

    const smoothedSample: FacialFrameSample = {
      ...rawSample,
      rawHeadAngles: rawSample.headAngles,
      headAngles: {
        yaw: Math.round(filteredAngles.x * 10) / 10,
        pitch: Math.round(filteredAngles.y * 10) / 10,
        roll: Math.round(filteredAngles.z * 10) / 10,
      },
      centroid: {
        x: this.centroidFilterX.filter(rawSample.centroid.x, rawSample.timestamp),
        y: this.centroidFilterY.filter(rawSample.centroid.y, rawSample.timestamp),
      },
    };

    this.samples.push(smoothedSample);

    // 2. Calibración inicial durante los primeros frames estables (~25 frames)
    if (!this.isCalibrated) {
      if (smoothedSample.faceDetected) {
        this.baselineSamples.push(smoothedSample);
        if (this.baselineSamples.length >= 24) {
          this.computeBaseline();
        }
      }
      return null;
    }

    // 3. Corte de buckets cada 10 segundos
    const currentBucketIndex = Math.floor(elapsedSeconds / 10);
    if (currentBucketIndex > this.lastBucketSecond && elapsedSeconds >= 10) {
      this.closeTimelineBucket(currentBucketIndex * 10, smoothedSample.isSpeaking);
      this.lastBucketSecond = currentBucketIndex;
    }

    // 4. Detección de picos y sugerencias
    return this.evaluateLiveCues(smoothedSample, elapsedSeconds, currentTranscriptSnippet);
  }

  /**
   * Inicia o reinicia la calibración guiada
   */
  public resetCalibration(): void {
    this.isCalibrated = false;
    this.baselineSamples = [];
    this.baselineCalibration = null;
    this.headAngleFilter.reset();
    this.centroidFilterX.reset();
    this.centroidFilterY.reset();
  }

  /**
   * Calcula la línea base neutra usando la mediana estadística (inmune a parpadeos)
   */
  private computeBaseline(): void {
    if (this.baselineSamples.length === 0) return;

    // Mediana de blendshapes
    const allKeys = Object.keys(this.baselineSamples[0].blendshapes);
    const medianBlendshapes: Record<string, number> = {};

    for (const key of allKeys) {
      const values = this.baselineSamples.map((s) => s.blendshapes[key] || 0);
      medianBlendshapes[key] = computeMedian(values);
    }
    this.baselineBlendshapes = medianBlendshapes;

    // Mediana de orientación de cabeza (compensa inclinación de cámara/laptop)
    const yaws = this.baselineSamples.map((s) => s.headAngles.yaw);
    const pitches = this.baselineSamples.map((s) => s.headAngles.pitch);
    const rolls = this.baselineSamples.map((s) => s.headAngles.roll);
    const medianAngles: HeadEulerAngles = {
      yaw: Math.round(computeMedian(yaws) * 10) / 10,
      pitch: Math.round(computeMedian(pitches) * 10) / 10,
      roll: Math.round(computeMedian(rolls) * 10) / 10,
    };

    // Mediana de iris y escala interocular
    const irisX = this.baselineSamples.map((s) => s.irisGaze?.avgHorizontalOffset || 0);
    const irisY = this.baselineSamples.map((s) => s.irisGaze?.avgVerticalOffset || 0);
    const scales = this.baselineSamples.map((s) => s.interocularDistance || 0.2);

    this.baselineCalibration = {
      blendshapes: medianBlendshapes,
      headAngles: medianAngles,
      irisOffset: { x: computeMedian(irisX), y: computeMedian(irisY) },
      faceScale: computeMedian(scales) || 0.2,
      calibratedAt: Date.now(),
    };

    this.isCalibrated = true;
    console.log("[FacialBehaviorAggregator] ✅ Calibración completada con éxito:", {
      baselineAngles: medianAngles,
      scale: this.baselineCalibration.faceScale,
    });
  }

  /**
   * Retorna una instantánea rápida O(1) de métricas en vivo sobre los últimos 5 segundos
   */
  public getLiveSnapshot(): LiveFacialSnapshot {
    if (!this.isCalibrated || this.samples.length < 5) {
      return {
        composure: 88,
        eyeContact: 85,
        gestureBalance: 88,
        postureStability: 90,
        warmth: 75,
        liveCue: null,
      };
    }

    // Ventana deslizante de ~35 frames (aprox 2.5 a 4 segundos a 15 FPS)
    const windowSamples = this.samples.slice(-35);
    const ctx = {
      samples: windowSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      baselineCalibration: this.baselineCalibration || undefined,
      windowDurationSec: 4.0,
    };

    const tensionRes = this.tensionStrategy.evaluate(ctx);
    const eyeRes = this.eyeContactStrategy.evaluate(ctx);
    const gestureRes = this.gestureStrategy.evaluate(ctx);
    const postureRes = this.postureStrategy.evaluate(ctx);

    const rawCue = tensionRes.alertCue || eyeRes.alertCue || gestureRes.alertCue || null;
    const liveCue = rawCue
      ? {
          id: `cue-${Date.now()}-${rawCue.type}`,
          type: rawCue.type,
          text: rawCue.text,
          severity: rawCue.severity,
          timestamp: Date.now(),
        }
      : null;

    return {
      composure: tensionRes.score,
      eyeContact: eyeRes.score,
      gestureBalance: gestureRes.score,
      postureStability: postureRes.details.postureStability ?? 85,
      warmth: postureRes.details.warmth ?? 75,
      liveCue,
    };
  }

  /**
   * Genera un bucket de la línea de tiempo cada 10 segundos
   */
  private closeTimelineBucket(second: number, isSpeaking: boolean): void {
    // Muestras de los últimos 10 segundos (~150 frames a 15-20 FPS)
    const recentSamples = this.samples.slice(-150);
    if (recentSamples.length === 0) return;

    const ctx = {
      samples: recentSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      baselineCalibration: this.baselineCalibration || undefined,
      windowDurationSec: 10,
    };

    const tensionRes = this.tensionStrategy.evaluate(ctx);
    const eyeRes = this.eyeContactStrategy.evaluate(ctx);
    const gestureRes = this.gestureStrategy.evaluate(ctx);
    const postureRes = this.postureStrategy.evaluate(ctx);

    this.timelineBuckets.push({
      second,
      tension: Math.round((tensionRes.details.avgTensionIndex ?? 0.18) * 100),
      eyeContact: eyeRes.score,
      gestureIntensity: Math.min(100, Math.round(gestureRes.metricValue * 2.8)),
      warmth: postureRes.details.warmth ?? 70,
      speaker: isSpeaking ? "user" : "agent",
    });
  }

  /**
   * Evalúa alertas y eventos pico con cooldown
   */
  private evaluateLiveCues(
    sample: FacialFrameSample,
    elapsedSeconds: number,
    snippet: string
  ): LiveCoachingCue | null {
    const windowSamples = this.samples.slice(-40);
    if (windowSamples.length < 15) return null;

    const ctx = {
      samples: windowSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      baselineCalibration: this.baselineCalibration || undefined,
      windowDurationSec: 3.5,
    };

    const tensionRes = this.tensionStrategy.evaluate(ctx);
    const eyeRes = this.eyeContactStrategy.evaluate(ctx);
    const gestureRes = this.gestureStrategy.evaluate(ctx);

    // Registro de picos significativos (hasta 8 máx en la entrevista)
    if ((tensionRes.details.maxHighTensionStreakFrames ?? 0) >= 16 && this.peakEvents.length < 8) {
      const alreadyRecent = this.peakEvents.some(
        (e) => Math.abs(e.timestampSec - elapsedSeconds) < 15 && e.type === "high_tension"
      );
      if (!alreadyRecent) {
        this.peakEvents.push({
          timestampSec: elapsedSeconds,
          type: "high_tension",
          severity: "high",
          durationSec: 3,
          contextSnippet: snippet ? snippet.slice(-100) : undefined,
        });
      }
    }

    if ((eyeRes.details.maxProlongedAwayFrames ?? 0) >= 22 && this.peakEvents.length < 8) {
      const alreadyRecent = this.peakEvents.some(
        (e) => Math.abs(e.timestampSec - elapsedSeconds) < 15 && e.type === "low_eye_contact"
      );
      if (!alreadyRecent) {
        this.peakEvents.push({
          timestampSec: elapsedSeconds,
          type: "low_eye_contact",
          severity: "moderate",
          durationSec: 4,
          contextSnippet: snippet ? snippet.slice(-100) : undefined,
        });
      }
    }

    if (gestureRes.details.gestureProfile === "over_expressive" && this.peakEvents.length < 8) {
      const alreadyRecent = this.peakEvents.some(
        (e) => Math.abs(e.timestampSec - elapsedSeconds) < 20 && e.type === "over_gesturing"
      );
      if (!alreadyRecent) {
        this.peakEvents.push({
          timestampSec: elapsedSeconds,
          type: "over_gesturing",
          severity: "moderate",
          durationSec: 4,
          contextSnippet: snippet ? snippet.slice(-100) : undefined,
        });
      }
    }

    // Alertas en el HUD con cooldown
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
   * Finaliza la sesión y consolida la telemetría completa
   */
  public finalizeSummary(totalDurationSeconds: number): FacialTelemetrySummary {
    const validSamples = this.samples.filter((s) => s.faceDetected);
    const validFaceFrames = validSamples.length;
    const totalFrames = this.samples.length;
    const facePresenceRatio = totalFrames > 0 ? validFaceFrames / totalFrames : 0;

    const ctx = {
      samples: this.samples,
      baselineBlendshapes: this.baselineBlendshapes,
      baselineCalibration: this.baselineCalibration || undefined,
      windowDurationSec: totalDurationSeconds,
    };

    const tensionRes = this.tensionStrategy.evaluate(ctx);
    const gestureRes = this.gestureStrategy.evaluate(ctx);
    const eyeRes = this.eyeContactStrategy.evaluate(ctx);
    const blinkRes = this.blinkStrategy.evaluate(ctx);
    const postureRes = this.postureStrategy.evaluate(ctx);

    // Comparativa hablando vs escuchando
    const speakingSamples = validSamples.filter((s) => s.isSpeaking);
    const listeningSamples = validSamples.filter((s) => !s.isSpeaking);

    const speakingTensionCtx = {
      samples: speakingSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      baselineCalibration: this.baselineCalibration || undefined,
      windowDurationSec: Math.max(1, totalDurationSeconds / 2),
    };
    const listeningEyeCtx = {
      samples: listeningSamples,
      baselineBlendshapes: this.baselineBlendshapes,
      baselineCalibration: this.baselineCalibration || undefined,
      windowDurationSec: Math.max(1, totalDurationSeconds / 2),
    };

    const speakingTension = this.tensionStrategy.evaluate(speakingTensionCtx).details.avgTensionIndex ?? 0.18;
    const listeningEyeContact = this.eyeContactStrategy.evaluate(listeningEyeCtx).score ?? 85;

    // Presencia ejecutiva balanceada
    const overallPresence = Math.round(
      eyeRes.score * 0.25 +
      tensionRes.score * 0.25 +
      gestureRes.score * 0.20 +
      (postureRes.details.postureStability ?? 85) * 0.15 +
      (postureRes.details.warmth ?? 75) * 0.15
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
        postureStability: postureRes.details.postureStability ?? 85,
        warmth: postureRes.details.warmth ?? 75,
      },
      indicators: {
        avgTensionIndex: tensionRes.details.avgTensionIndex ?? 0.18,
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
