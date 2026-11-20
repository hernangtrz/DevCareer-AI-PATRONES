import { FacialFrameSample } from "../types";

/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL STRATEGY (GoF): IFacialMetricStrategy
 * ============================================================================
 * Cada estrategia encapsula un algoritmo especializado de inferencia conductual
 * sobre la secuencia de muestras de video y audio.
 */
export interface StrategyEvaluationContext {
  samples: FacialFrameSample[];
  baselineBlendshapes: Record<string, number>;
  windowDurationSec: number;
}

export interface MetricStrategyDetails {
  avgTensionIndex?: number;
  maxHighTensionStreakFrames?: number;
  gestureProfile?: "natural" | "over_expressive" | "rigid";
  headMovementVolatility?: number;
  browVolatility?: number;
  inContactPercent?: number;
  maxProlongedAwayFrames?: number;
  blinksCount?: number;
  blinkRatePerMin?: number;
  postureStability?: number;
  warmth?: number;
  facePresencePercent?: number;
  [key: string]: unknown;
}

export interface MetricStrategyResult {
  score: number; // 0..100
  metricValue: number; // Valor numérico crudo del indicador
  details: MetricStrategyDetails;
  alertCue?: {
    type: "tension" | "gaze" | "posture" | "gesture" | "calm";
    text: string;
    severity: "info" | "warning";
  };
}

export interface IFacialMetricStrategy {
  readonly name: string;
  evaluate(context: StrategyEvaluationContext): MetricStrategyResult;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. ESTRATEGIA: CONTROL DE TENSIÓN FACIAL (FACS AU4, AU24, etc.)
// ────────────────────────────────────────────────────────────────────────────
export class TensionStrategy implements IFacialMetricStrategy {
  public readonly name = "TensionStrategy";

  public evaluate(context: StrategyEvaluationContext): MetricStrategyResult {
    const { samples, baselineBlendshapes } = context;
    if (samples.length === 0) {
      return { score: 85, metricValue: 0.15, details: { avgTension: 0.15 } };
    }

    let accumulatedTension = 0;
    let validFrames = 0;
    let highTensionStreakFrames = 0;
    let maxHighTensionStreak = 0;

    for (const sample of samples) {
      if (!sample.faceDetected) continue;
      validFrames++;

      const bs = sample.blendshapes;
      const base = baselineBlendshapes;

      // Unidades de Acción de Tensión (FACS):
      // AU4: Ceño fruncido (browDown)
      const browTension = Math.max(
        0,
        ((bs["browDownLeft"] || 0) - (base["browDownLeft"] || 0) +
         (bs["browDownRight"] || 0) - (base["browDownRight"] || 0)) / 2
      );

      // AU24: Tensión labial y comisuras comprimidas (mouthPress, mouthStretch)
      const mouthTension = Math.max(
        0,
        ((bs["mouthPressLeft"] || 0) - (base["mouthPressLeft"] || 0) +
         (bs["mouthPressRight"] || 0) - (base["mouthPressRight"] || 0) +
         (bs["mouthStretchLeft"] || 0) * 0.5 +
         (bs["mouthStretchRight"] || 0) * 0.5) / 2
      );

      // Entrecerrar ojos por tensión / estrés cognitivo
      const eyeSquint = Math.max(
        0,
        ((bs["eyeSquintLeft"] || 0) - (base["eyeSquintLeft"] || 0) +
         (bs["eyeSquintRight"] || 0) - (base["eyeSquintRight"] || 0)) / 2
      );

      // Arrugar nariz (disgusto / rechazo / estrés)
      const noseSneer = Math.max(
        0,
        ((bs["noseSneerLeft"] || 0) + (bs["noseSneerRight"] || 0)) / 2
      );

      // Si el candidato está hablando, atenuamos la tensión labial para no castigar fonética
      const effectiveMouthTension = sample.isSpeaking ? mouthTension * 0.4 : mouthTension;

      // Ponderación de tensión facial compuesta (0..1)
      const frameTension = Math.min(
        1,
        browTension * 0.40 + effectiveMouthTension * 0.35 + eyeSquint * 0.15 + noseSneer * 0.10
      );

      accumulatedTension += frameTension;

      if (frameTension > 0.45) {
        highTensionStreakFrames++;
        if (highTensionStreakFrames > maxHighTensionStreak) {
          maxHighTensionStreak = highTensionStreakFrames;
        }
      } else {
        highTensionStreakFrames = 0;
      }
    }

    const avgTension = validFrames > 0 ? accumulatedTension / validFrames : 0.2;
    // Composure Score: Inverso a la tensión promedio (100 = sereno, 0 = extremadamente tenso)
    const composureScore = Math.round(Math.max(20, Math.min(100, (1 - avgTension * 1.5) * 100)));

    let alertCue;
    // Alerta solo si la tensión sostenida dura al menos 4 segundos (~25 frames a 6-7 FPS)
    if (maxHighTensionStreak >= 24) {
      alertCue = {
        type: "tension" as const,
        text: "Relaja el entrecejo y los hombros",
        severity: "warning" as const,
      };
    }

    return {
      score: composureScore,
      metricValue: Math.round(avgTension * 100) / 100,
      details: {
        avgTensionIndex: Math.round(avgTension * 100) / 100,
        maxHighTensionStreakFrames: maxHighTensionStreak,
      },
      alertCue,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. ESTRATEGIA: EQUILIBRIO GESTUAL Y VOLATILIDAD CINEMÁTICA
// ────────────────────────────────────────────────────────────────────────────
export class GestureVolatilityStrategy implements IFacialMetricStrategy {
  public readonly name = "GestureVolatilityStrategy";

  public evaluate(context: StrategyEvaluationContext): MetricStrategyResult {
    const { samples } = context;
    if (samples.length < 5) {
      return {
        score: 85,
        metricValue: 0.2,
        details: { gestureProfile: "natural", headMovementVolatility: 2.5 },
      };
    }

    let headAngularDeltaSum = 0;
    let browVarianceSum = 0;
    let prevSample: FacialFrameSample | null = null;
    let validTransitions = 0;

    for (const sample of samples) {
      if (!sample.faceDetected) continue;
      if (prevSample && prevSample.faceDetected) {
        validTransitions++;
        const dt = Math.max(0.05, (sample.timestamp - prevSample.timestamp) / 1000);

        // Velocidad angular de la cabeza en grados por segundo
        const dyaw = Math.abs(sample.headAngles.yaw - prevSample.headAngles.yaw);
        const dpitch = Math.abs(sample.headAngles.pitch - prevSample.headAngles.pitch);
        const droll = Math.abs(sample.headAngles.roll - prevSample.headAngles.roll);
        headAngularDeltaSum += (dyaw + dpitch + droll) / dt;

        // Variabilidad de cejas (inquietud gestual o inexpresividad)
        const browMove =
          Math.abs((sample.blendshapes["browInnerUp"] || 0) - (prevSample.blendshapes["browInnerUp"] || 0)) +
          Math.abs((sample.blendshapes["browOuterUpLeft"] || 0) - (prevSample.blendshapes["browOuterUpLeft"] || 0));
        browVarianceSum += browMove / dt;
      }
      prevSample = sample;
    }

    const avgHeadSpeed = validTransitions > 0 ? headAngularDeltaSum / validTransitions : 3;
    const avgBrowVolatility = validTransitions > 0 ? browVarianceSum / validTransitions : 0.5;

    // Clasificación del perfil gestual
    let gestureProfile: "natural" | "over_expressive" | "rigid" = "natural";
    let score = 88;
    let alertCue;

    if (avgHeadSpeed > 35 || avgBrowVolatility > 2.8) {
      gestureProfile = "over_expressive";
      score = Math.max(45, Math.round(90 - (avgHeadSpeed - 35) * 1.2));
      alertCue = {
        type: "gesture" as const,
        text: "Mucho movimiento gestual; mantén mayor estabilidad",
        severity: "warning" as const,
      };
    } else if (avgHeadSpeed < 1.2 && avgBrowVolatility < 0.12) {
      gestureProfile = "rigid";
      score = Math.max(50, Math.round(75 + avgHeadSpeed * 5));
    } else {
      gestureProfile = "natural";
      score = Math.min(98, Math.round(85 + (15 - Math.abs(avgHeadSpeed - 12)) * 0.8));
    }

    return {
      score,
      metricValue: Math.round(avgHeadSpeed * 10) / 10,
      details: {
        gestureProfile,
        headMovementVolatility: Math.round(avgHeadSpeed * 10) / 10,
        browVolatility: Math.round(avgBrowVolatility * 100) / 100,
      },
      alertCue,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 3. ESTRATEGIA: CONTACTO VISUAL CON LA CÁMARA
// ────────────────────────────────────────────────────────────────────────────
export class EyeContactStrategy implements IFacialMetricStrategy {
  public readonly name = "EyeContactStrategy";

  public evaluate(context: StrategyEvaluationContext): MetricStrategyResult {
    const { samples } = context;
    if (samples.length === 0) {
      return { score: 85, metricValue: 85, details: { inContactPercent: 85 } };
    }

    let inContactFrames = 0;
    let validFrames = 0;
    let prolongedAwayFrames = 0;
    let maxProlongedAway = 0;

    for (const sample of samples) {
      if (!sample.faceDetected) continue;
      validFrames++;

      const { yaw, pitch } = sample.headAngles;
      const bs = sample.blendshapes;

      // Desviación de mirada (pupilas mirando a los costados o hacia abajo)
      const gazeAwayX = Math.max(
        bs["eyeLookOutLeft"] || 0,
        bs["eyeLookInRight"] || 0,
        bs["eyeLookInLeft"] || 0,
        bs["eyeLookOutRight"] || 0
      );
      const gazeDown = Math.max(bs["eyeLookDownLeft"] || 0, bs["eyeLookDownRight"] || 0);

      // Consideramos contacto visual si la cabeza mira hacia la cámara (yaw <= 18°, pitch <= 16°)
      // y la desviación pupilar no es excesiva (> 0.50)
      const isHeadFacing = Math.abs(yaw) <= 18 && Math.abs(pitch) <= 16;
      const isGazeDirect = gazeAwayX < 0.48 && gazeDown < 0.52;

      if (isHeadFacing && isGazeDirect) {
        inContactFrames++;
        prolongedAwayFrames = 0;
      } else {
        prolongedAwayFrames++;
        if (prolongedAwayFrames > maxProlongedAway) {
          maxProlongedAway = prolongedAwayFrames;
        }
      }
    }

    const contactRatio = validFrames > 0 ? inContactFrames / validFrames : 0.8;
    // En entrevistas remotas, 65%-85% de contacto visual es el rango más natural y profesional.
    // 100% de mirada fija continua resulta intimidante, < 50% proyecta inseguridad o lectura de guión.
    let eyeContactScore = Math.round(contactRatio * 100);
    if (contactRatio >= 0.65 && contactRatio <= 0.88) {
      eyeContactScore = Math.min(98, Math.round(eyeContactScore * 1.1));
    } else if (contactRatio < 0.45) {
      eyeContactScore = Math.max(30, Math.round(contactRatio * 90));
    }

    let alertCue;
    // Alerta si el candidato mira a otro lado por más de 5 segundos seguidos (~32 frames)
    if (maxProlongedAway >= 32) {
      alertCue = {
        type: "gaze" as const,
        text: "Conecta la mirada con la cámara",
        severity: "info" as const,
      };
    }

    return {
      score: eyeContactScore,
      metricValue: Math.round(contactRatio * 100),
      details: {
        inContactPercent: Math.round(contactRatio * 100),
        maxProlongedAwayFrames: maxProlongedAway,
      },
      alertCue,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 4. ESTRATEGIA: TASA DE PARPADEO (Blink Rate / Estrés Cognitivo)
// ────────────────────────────────────────────────────────────────────────────
export class BlinkRateStrategy implements IFacialMetricStrategy {
  public readonly name = "BlinkRateStrategy";

  public evaluate(context: StrategyEvaluationContext): MetricStrategyResult {
    const { samples, windowDurationSec } = context;
    if (samples.length < 10 || windowDurationSec <= 0) {
      return { score: 90, metricValue: 16, details: { blinksCount: 2, blinkRatePerMin: 16 } };
    }

    let blinksCount = 0;
    let isBlinking = false;
    let lastBlinkTime = 0;

    for (const sample of samples) {
      if (!sample.faceDetected) continue;
      const blinkScore = Math.max(
        sample.blendshapes["eyeBlinkLeft"] || 0,
        sample.blendshapes["eyeBlinkRight"] || 0
      );

      // Pico de parpadeo con debounce de 200 ms
      if (blinkScore > 0.55 && !isBlinking) {
        if (sample.timestamp - lastBlinkTime > 200) {
          blinksCount++;
          lastBlinkTime = sample.timestamp;
          isBlinking = true;
        }
      } else if (blinkScore < 0.25) {
        isBlinking = false;
      }
    }

    const durationMinutes = Math.max(0.1, windowDurationSec / 60);
    const blinkRatePerMin = Math.round(blinksCount / durationMinutes);

    // Normal en conversación: 14 a 22 parpadeos/minuto.
    // > 30/min indica nerviosismo o fatiga visual aguda; < 7/min indica hiper-tensión ocular.
    let score = 90;
    if (blinkRatePerMin >= 12 && blinkRatePerMin <= 24) {
      score = 95;
    } else if (blinkRatePerMin > 32) {
      score = Math.max(50, 90 - (blinkRatePerMin - 32) * 2);
    } else if (blinkRatePerMin < 8) {
      score = Math.max(60, 90 - (8 - blinkRatePerMin) * 3);
    }

    return {
      score,
      metricValue: blinkRatePerMin,
      details: {
        blinksCount,
        blinkRatePerMin,
      },
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 5. ESTRATEGIA: ESTABILIDAD POSTURAL Y CALIDEZ EXPRESIVA
// ────────────────────────────────────────────────────────────────────────────
export class PostureWarmthStrategy implements IFacialMetricStrategy {
  public readonly name = "PostureWarmthStrategy";

  public evaluate(context: StrategyEvaluationContext): MetricStrategyResult {
    const { samples } = context;
    if (samples.length === 0) {
      return {
        score: 85,
        metricValue: 85,
        details: { postureStability: 85, warmth: 75, facePresencePercent: 100 },
      };
    }

    let detectedFaces = 0;
    let rollDeviationSum = 0;
    let smilePresenceSum = 0;
    let centroidShiftSum = 0;
    let prevCentroid: { x: number; y: number } | null = null;

    for (const sample of samples) {
      if (!sample.faceDetected) continue;
      detectedFaces++;

      // Inclinación lateral de la cabeza
      rollDeviationSum += Math.abs(sample.headAngles.roll);

      // Sonrisa / calidez genuina (Duchenne)
      const smile =
        ((sample.blendshapes["mouthSmileLeft"] || 0) + (sample.blendshapes["mouthSmileRight"] || 0)) / 2;
      const cheek =
        ((sample.blendshapes["cheekSquintLeft"] || 0) + (sample.blendshapes["cheekSquintRight"] || 0)) / 2;
      smilePresenceSum += (smile * 0.7 + cheek * 0.3);

      if (prevCentroid) {
        const dx = sample.centroid.x - prevCentroid.x;
        const dy = sample.centroid.y - prevCentroid.y;
        centroidShiftSum += Math.sqrt(dx * dx + dy * dy);
      }
      prevCentroid = sample.centroid;
    }

    const facePresenceRatio = detectedFaces / samples.length;
    const avgRoll = detectedFaces > 0 ? rollDeviationSum / detectedFaces : 0;
    const avgWarmth = detectedFaces > 0 ? smilePresenceSum / detectedFaces : 0.1;
    const avgShift = detectedFaces > 1 ? centroidShiftSum / (detectedFaces - 1) : 0;

    // Postura: penaliza inclinaciones excesivas (roll > 12°) y balanceos de encuadre
    let postureScore = 90;
    if (avgRoll > 12) postureScore -= (avgRoll - 12) * 2;
    if (avgShift > 0.04) postureScore -= (avgShift - 0.04) * 500;
    postureScore = Math.round(Math.max(40, Math.min(100, postureScore)));

    // Calidez: premia entre 10% y 35% de presencia sutil de sonrisa
    const warmthScore = Math.round(
      Math.min(95, Math.max(50, 60 + avgWarmth * 120))
    );

    let alertCue;
    if (avgRoll > 16) {
      alertCue = {
        type: "posture" as const,
        text: "Alinea tu postura con la cámara",
        severity: "info" as const,
      };
    }

    return {
      score: Math.round((postureScore + warmthScore) / 2),
      metricValue: postureScore,
      details: {
        postureStability: postureScore,
        warmth: warmthScore,
        facePresencePercent: Math.round(facePresenceRatio * 100),
      },
      alertCue,
    };
  }
}
