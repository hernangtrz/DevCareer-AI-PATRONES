/**
 * Tipos y contratos para el análisis facial y comportamiento no verbal
 * en DevCareer AI (MediaPipe Face Landmarker + Edge AI).
 */

export interface FacialTimelineBucket {
  second: number;              // 0, 15, 30, 45...
  tension: number;             // 0..100
  eyeContact: number;          // 0..100
  gestureIntensity: number;    // 0..100
  warmth: number;              // 0..100
  speaker: "user" | "agent";
}

export interface FacialPeakEvent {
  timestampSec: number;
  type: "high_tension" | "over_gesturing" | "low_eye_contact" | "rigid_posture" | "rapid_blinking";
  severity: "moderate" | "high";
  durationSec: number;
  contextSnippet?: string;     // Último fragmento del transcript en ese instante
}

export interface FacialTelemetrySummary {
  enabled: boolean;
  durationSeconds: number;
  sampledFrames: number;
  validFaceFrames: number;
  facePresenceRatio: number;   // 0..1
  calibrated: boolean;
  scores: {
    overallPresence: number;   // 0..100
    eyeContact: number;        // 0..100
    composure: number;         // 0..100 (inverso a tensión)
    gestureBalance: number;    // 0..100
    postureStability: number;  // 0..100
    warmth: number;            // 0..100
  };
  indicators: {
    avgTensionIndex: number;        // 0..1
    gestureProfile: "natural" | "over_expressive" | "rigid";
    blinkRatePerMin: number;
    headMovementVolatility: number; // grados/seg promedio
    speakingVsListening: {
      speakingTensionAvg: number;
      listeningEyeContactAvg: number;
    };
  };
  timeline: FacialTimelineBucket[];
  peakEvents: FacialPeakEvent[];
}

export interface FacialBehaviorFeedback {
  overallScore: number;                 // 0..100
  expressiveProfile: string;            // Ej: "Sereno y natural", "Tensión moderada", "Sobre-gesticulación"
  summaryComment: string;               // Resumen ejecutivo empático generado por IA
  metrics: {
    eyeContact: number;
    composure: number;
    gestureBalance: number;
    postureStability: number;
    warmth: number;
    blinkRatePerMin: number;
    facePresencePercent: number;
  };
  strengths: string[];                  // Fortalezas no verbales observadas
  habitsToImprove: string[];            // Hábitos específicos (ej. fruncir el ceño al pensar)
  coachingTips: string[];               // Ejercicios prácticos concretos para la próxima sesión
  keyMoments: Array<{
    timestampSec: number;
    label: string;
    observation: string;
  }>;
  timeline: FacialTimelineBucket[];
}

export interface LiveCoachingCue {
  id: string;
  type: "tension" | "gaze" | "posture" | "gesture" | "calm";
  text: string;
  severity: "info" | "warning";
  timestamp: number;
}

export interface FaceLandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface HeadEulerAngles {
  yaw: number;   // Rotación horizontal (mirar izq/der) en grados
  pitch: number; // Inclinación vertical (mirar arriba/abajo) en grados
  roll: number;  // Inclinación lateral (ladear cabeza) en grados
}

export interface FacialFrameSample {
  timestamp: number;
  faceDetected: boolean;
  blendshapes: Record<string, number>;
  headAngles: HeadEulerAngles;
  centroid: { x: number; y: number };
  isSpeaking: boolean;
}
