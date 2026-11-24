import { FacialFrameSample, FacialBaselineCalibration } from "../types";

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
  baselineCalibration?: FacialBaselineCalibration;
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
// 1. ESTRATEGIA: CONTROL DE TENSIÓN FACIAL (FACS AU4, AU24, AU6/7, AU9)
// ────────────────────────────────────────────────────────────────────────────
export class TensionStrategy implements IFacialMetricStrategy {
  public readonly name = "TensionStrategy";

  public evaluate(context: StrategyEvaluationContext): MetricStrategyResult {
    const { samples, baselineBlendshapes } = context;
    if (samples.length === 0) {
      return { score: 85, metricValue: 0.15, details: { avgTensionIndex: 0.15 } };
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

      // Unidades de Acción de Tensión (FACS) relativas a la línea base neutra:
      // AU4: Ceño fruncido (browDown)
      const browTension = Math.max(
        0,
        ((bs["browDownLeft"] || 0) - (base["browDownLeft"] || 0) +
         (bs["browDownRight"] || 0) - (base["browDownRight"] || 0)) / 2
      );

      // AU24: Tensión labial y comisuras comprimidas (mouthPress, mouthStretch, mouthFrown)
      const mouthTension = Math.max(
        0,
        ((bs["mouthPressLeft"] || 0) - (base["mouthPressLeft"] || 0) +
         (bs["mouthPressRight"] || 0) - (base["mouthPressRight"] || 0) +
         ((bs["mouthStretchLeft"] || 0) - (base["mouthStretchLeft"] || 0)) * 0.5 +
         ((bs["mouthStretchRight"] || 0) - (base["mouthStretchRight"] || 0)) * 0.5 +
         ((bs["mouthFrownLeft"] || 0) - (base["mouthFrownLeft"] || 0)) * 0.4 +
         ((bs["mouthFrownRight"] || 0) - (base["mouthFrownRight"] || 0)) * 0.4) / 2
      );

      // AU6/7: Entrecerrar ojos por tensión / estrés cognitivo
      const eyeSquint = Math.max(
        0,
        ((bs["eyeSquintLeft"] || 0) - (base["eyeSquintLeft"] || 0) +
         (bs["eyeSquintRight"] || 0) - (base["eyeSquintRight"] || 0)) / 2
      );

      // AU9: Arrugar nariz (disgusto / rechazo / estrés)
      const noseSneer = Math.max(
        0,
        ((bs["noseSneerLeft"] || 0) - (base["noseSneerLeft"] || 0) +
         (bs["noseSneerRight"] || 0) - (base["noseSneerRight"] || 0)) / 2
      );

      // Si el candidato está hablando, atenuamos la tensión labial para no castigar fonética
      const effectiveMouthTension = sample.isSpeaking ? mouthTension * 0.35 : mouthTension;

      // Fórmula híbrida: combina el canal dominante con el promedio ponderado
      const dominantChannel = Math.max(browTension, effectiveMouthTension, eyeSquint);
      const weightedTension =
        browTension * 0.40 + effectiveMouthTension * 0.35 + eyeSquint * 0.15 + noseSneer * 0.10;
      const frameTension = Math.min(1, Math.max(dominantChannel * 0.85, weightedTension));

      accumulatedTension += frameTension;

      // Umbral calibrado de tensión activa perceptible (> 0.30)
      if (frameTension > 0.30) {
        highTensionStreakFrames++;
        if (highTensionStreakFrames > maxHighTensionStreak) {
          maxHighTensionStreak = highTensionStreakFrames;
        }
      } else {
        highTensionStreakFrames = 0;
      }
    }

    const avgTension = validFrames > 0 ? accumulatedTension / validFrames : 0.18;
    // Composure Score: Inverso a la tensión promedio calibrado (100 = sereno, 20 = máxima tensión)
    const composureScore = Math.round(Math.max(20, Math.min(100, (1 - avgTension * 1.4) * 100)));

    let alertCue;
    // Alerta si la tensión sostenida dura al menos ~2.5 segundos (>= 16 frames a 15-20 FPS)
    if (maxHighTensionStreak >= 16) {
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
        score: 88,
        metricValue: 2.5,
        details: { gestureProfile: "natural", headMovementVolatility: 2.5, browVolatility: 0.3 },
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
        const dt = Math.max(0.04, (sample.timestamp - prevSample.timestamp) / 1000);

        // Velocidad angular de la cabeza en grados por segundo
        const dyaw = Math.abs(sample.headAngles.yaw - prevSample.headAngles.yaw);
        const dpitch = Math.abs(sample.headAngles.pitch - prevSample.headAngles.pitch);
        const droll = Math.abs(sample.headAngles.roll - prevSample.headAngles.roll);
        headAngularDeltaSum += (dyaw + dpitch + droll) / dt;

        // Variabilidad de cejas (inquietud gestual o inexpresividad)
        const browMove =
          Math.abs((sample.blendshapes["browInnerUp"] || 0) - (prevSample.blendshapes["browInnerUp"] || 0)) +
          Math.abs((sample.blendshapes["browOuterUpLeft"] || 0) - (prevSample.blendshapes["browOuterUpLeft"] || 0)) +
          Math.abs((sample.blendshapes["browDownLeft"] || 0) - (prevSample.blendshapes["browDownLeft"] || 0));
        browVarianceSum += browMove / dt;
      }
      prevSample = sample;
    }

    const avgHeadSpeed = validTransitions > 0 ? headAngularDeltaSum / validTransitions : 3;
    const avgBrowVolatility = validTransitions > 0 ? browVarianceSum / validTransitions : 0.4;

    // Clasificación del perfil gestual
    let gestureProfile: "natural" | "over_expressive" | "rigid" = "natural";
    let score = 90;
    let alertCue;

    if (avgHeadSpeed > 32 || avgBrowVolatility > 2.6) {
      gestureProfile = "over_expressive";
      score = Math.max(45, Math.round(92 - (avgHeadSpeed - 32) * 1.3));
      alertCue = {
        type: "gesture" as const,
        text: "Mucho movimiento gestual; mantén mayor estabilidad",
        severity: "warning" as const,
      };
    } else if (avgHeadSpeed < 1.0 && avgBrowVolatility < 0.10) {
      gestureProfile = "rigid";
      score = Math.max(50, Math.round(75 + avgHeadSpeed * 8));
    } else {
      gestureProfile = "natural";
      score = Math.min(98, Math.round(86 + (14 - Math.abs(avgHeadSpeed - 10)) * 0.9));
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
// 3. ESTRATEGIA: CONTACTO VISUAL CON LA CÁMARA (CALIBRACIÓN 3D + IRIS)
// ────────────────────────────────────────────────────────────────────────────
export class EyeContactStrategy implements IFacialMetricStrategy {
  public readonly name = "EyeContactStrategy";

  public evaluate(context: StrategyEvaluationContext): MetricStrategyResult {
    const { samples, baselineCalibration, baselineBlendshapes } = context;
    if (samples.length === 0) {
      return { score: 85, metricValue: 85, details: { inContactPercent: 85 } };
    }

    const baseYaw = baselineCalibration?.headAngles?.yaw ?? 0;
    const basePitch = baselineCalibration?.headAngles?.pitch ?? 0;

    let inContactFrames = 0;
    let validFrames = 0;
    let prolongedAwayFrames = 0;
    let maxProlongedAway = 0;

    for (const sample of samples) {
      if (!sample.faceDetected) continue;
      validFrames++;

      // Ángulos relativos a la calibración neutra del usuario mirando a su pantalla
      const deltaYaw = Math.abs(sample.headAngles.yaw - baseYaw);
      const deltaPitch = Math.abs(sample.headAngles.pitch - basePitch);

      const bs = sample.blendshapes;
      const base = baselineBlendshapes;

      // Desviación de mirada relativa al baseline neutro
      const gazeAwayX = Math.max(
        (bs["eyeLookOutLeft"] || 0) - (base["eyeLookOutLeft"] || 0),
        (bs["eyeLookInRight"] || 0) - (base["eyeLookInRight"] || 0),
        (bs["eyeLookInLeft"] || 0) - (base["eyeLookInLeft"] || 0),
        (bs["eyeLookOutRight"] || 0) - (base["eyeLookOutRight"] || 0)
      );
      const gazeDown = Math.max(
        (bs["eyeLookDownLeft"] || 0) - (base["eyeLookDownLeft"] || 0),
        (bs["eyeLookDownRight"] || 0) - (base["eyeLookDownRight"] || 0)
      );

      // Métricas de iris si están disponibles
      let irisOffsetMagnitude = 0;
      if (sample.irisGaze) {
        irisOffsetMagnitude = Math.hypot(sample.irisGaze.avgHorizontalOffset, sample.irisGaze.avgVerticalOffset);
      }

      // Se considera contacto visual si la cabeza se mantiene dentro del cono frontal
      // (|Δyaw| <= 17°, |Δpitch| <= 15°) y la mirada no se desvía fuertemente
      const isHeadFacing = deltaYaw <= 17 && deltaPitch <= 15;
      const isGazeDirect = gazeAwayX < 0.40 && gazeDown < 0.45 && irisOffsetMagnitude < 0.35;

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
    // Rango ideal en videollamadas: 65% a 88% de contacto visual
    let eyeContactScore = Math.round(contactRatio * 100);
    if (contactRatio >= 0.65 && contactRatio <= 0.88) {
      eyeContactScore = Math.min(98, Math.round(eyeContactScore * 1.1));
    } else if (contactRatio < 0.45) {
      eyeContactScore = Math.max(30, Math.round(contactRatio * 85));
    }

    let alertCue;
    // Alerta si el candidato desvía la mirada de forma continua por >= 3.0s (>= 22 frames a 15-20 FPS)
    if (maxProlongedAway >= 22) {
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
// 4. ESTRATEGIA: TASA DE PARPADEO (Blink Rate / Histéresis Relativa)
// ────────────────────────────────────────────────────────────────────────────
export class BlinkRateStrategy implements IFacialMetricStrategy {
  public readonly name = "BlinkRateStrategy";

  public evaluate(context: StrategyEvaluationContext): MetricStrategyResult {
    const { samples, windowDurationSec, baselineBlendshapes } = context;
    if (samples.length < 8 || windowDurationSec <= 0) {
      return { score: 92, metricValue: 16, details: { blinksCount: 2, blinkRatePerMin: 16 } };
    }

    let blinksCount = 0;
    let isBlinking = false;
    let lastBlinkTime = 0;

    const baseBlink = Math.max(
      baselineBlendshapes["eyeBlinkLeft"] || 0,
      baselineBlendshapes["eyeBlinkRight"] || 0
    );

    for (const sample of samples) {
      if (!sample.faceDetected) continue;
      const rawBlink = Math.max(
        sample.blendshapes["eyeBlinkLeft"] || 0,
        sample.blendshapes["eyeBlinkRight"] || 0
      );
      const deltaBlink = rawBlink - baseBlink;

      // Cierre con histéresis y debounce de 180 ms
      if (deltaBlink > 0.38 && !isBlinking) {
        if (sample.timestamp - lastBlinkTime > 180) {
          blinksCount++;
          lastBlinkTime = sample.timestamp;
          isBlinking = true;
        }
      } else if (deltaBlink < 0.18) {
        isBlinking = false;
      }
    }

    const durationMinutes = Math.max(0.1, windowDurationSec / 60);
    const blinkRatePerMin = Math.round(blinksCount / durationMinutes);

    // Normal en conversación técnica: 14 a 24 parpadeos/minuto
    let score = 90;
    if (blinkRatePerMin >= 12 && blinkRatePerMin <= 24) {
      score = 96;
    } else if (blinkRatePerMin > 32) {
      score = Math.max(50, 92 - (blinkRatePerMin - 32) * 2);
    } else if (blinkRatePerMin < 7) {
      score = Math.max(60, 92 - (7 - blinkRatePerMin) * 3);
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
    const { samples, baselineCalibration } = context;
    if (samples.length === 0) {
      return {
        score: 85,
        metricValue: 85,
        details: { postureStability: 85, warmth: 75, facePresencePercent: 100 },
      };
    }

    const baseRoll = baselineCalibration?.headAngles?.roll ?? 0;
    const baseScale = baselineCalibration?.faceScale ?? 0.2;

    let detectedFaces = 0;
    let rollDeviationSum = 0;
    let smilePresenceSum = 0;
    let centroidShiftSum = 0;
    let prevCentroid: { x: number; y: number } | null = null;

    for (const sample of samples) {
      if (!sample.faceDetected) continue;
      detectedFaces++;

      // Inclinación lateral de la cabeza respecto a la postura base
      rollDeviationSum += Math.abs(sample.headAngles.roll - baseRoll);

      // Sonrisa / calidez genuina (Duchenne)
      const smile =
        ((sample.blendshapes["mouthSmileLeft"] || 0) + (sample.blendshapes["mouthSmileRight"] || 0)) / 2;
      const cheek =
        ((sample.blendshapes["cheekSquintLeft"] || 0) + (sample.blendshapes["cheekSquintRight"] || 0)) / 2;
      smilePresenceSum += (smile * 0.7 + cheek * 0.3);

      if (prevCentroid) {
        const dx = sample.centroid.x - prevCentroid.x;
        const dy = sample.centroid.y - prevCentroid.y;
        // Normalizado por la escala del rostro para que no varíe según la distancia
        const scaleNorm = sample.interocularDistance || baseScale || 0.2;
        centroidShiftSum += Math.hypot(dx, dy) / scaleNorm;
      }
      prevCentroid = sample.centroid;
    }

    const facePresenceRatio = detectedFaces / samples.length;
    const avgRoll = detectedFaces > 0 ? rollDeviationSum / detectedFaces : 0;
    const avgWarmth = detectedFaces > 0 ? smilePresenceSum / detectedFaces : 0.1;
    const avgShiftNorm = detectedFaces > 1 ? centroidShiftSum / (detectedFaces - 1) : 0;

    // Postura: penaliza inclinaciones (roll > 10°) y balanceos de encuadre
    let postureScore = 92;
    if (avgRoll > 10) postureScore -= (avgRoll - 10) * 2.2;
    if (avgShiftNorm > 0.15) postureScore -= (avgShiftNorm - 0.15) * 80;
    postureScore = Math.round(Math.max(40, Math.min(100, postureScore)));

    // Calidez: premia entre 10% y 35% de presencia sutil de expresión cordial
    const warmthScore = Math.round(
      Math.min(95, Math.max(50, 62 + avgWarmth * 115))
    );

    let alertCue;
    if (avgRoll > 15) {
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
