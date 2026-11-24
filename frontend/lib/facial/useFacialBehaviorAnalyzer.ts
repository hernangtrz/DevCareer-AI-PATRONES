"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MediaPipeFaceProvider } from "./mediapipe-face.provider";
import { FacialBehaviorAggregator } from "./facial-behavior.aggregator";
import {
  LiveCoachingCue,
  FacialTelemetrySummary,
  FacialFrameSample,
  FaceLandmarkPoint,
  LiveFacialSnapshot,
} from "./types";

interface UseFacialBehaviorAnalyzerProps {
  isEnabled: boolean;
  isCallActive: boolean;
  isSpeaking: boolean;
  elapsedSeconds: number;
  currentTranscriptSnippet?: string;
  showMeshOverlay?: boolean;
}

// Grupos anatómicos canónicos de MediaPipe Face Landmarker
const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
  378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109, 10,
];
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];
const LEFT_EYEBROW_INDICES = [70, 63, 105, 66, 107];
const RIGHT_EYEBROW_INDICES = [300, 293, 334, 296, 336];
const LIPS_OUTER_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 61];

export function useFacialBehaviorAnalyzer({
  isEnabled,
  isCallActive,
  isSpeaking,
  elapsedSeconds,
  currentTranscriptSnippet = "",
  showMeshOverlay = false,
}: UseFacialBehaviorAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const providerRef = useRef<MediaPipeFaceProvider | null>(null);
  const aggregatorRef = useRef<FacialBehaviorAggregator>(new FacialBehaviorAggregator());

  const [isModelReady, setIsModelReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [liveCue, setLiveCue] = useState<LiveCoachingCue | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const [liveScores, setLiveScores] = useState({
    composure: 88,
    eyeContact: 85,
    gestureBalance: 88,
    postureStability: 90,
    warmth: 75,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);
  const lastScoreUpdateTimeRef = useRef<number>(0);

  // Refs de estado dinámico para desacoplar el requestAnimationFrame y evitar reinicios cada segundo
  const isCallActiveRef = useRef(isCallActive);
  const isSpeakingRef = useRef(isSpeaking);
  const elapsedSecondsRef = useRef(elapsedSeconds);
  const currentTranscriptSnippetRef = useRef(currentTranscriptSnippet);
  const showMeshOverlayRef = useRef(showMeshOverlay);

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
    isSpeakingRef.current = isSpeaking;
    elapsedSecondsRef.current = elapsedSeconds;
    currentTranscriptSnippetRef.current = currentTranscriptSnippet;
    showMeshOverlayRef.current = showMeshOverlay;
  }, [isCallActive, isSpeaking, elapsedSeconds, currentTranscriptSnippet, showMeshOverlay]);

  // Pacing adaptativo de frames para proteger prioridad de audio WebRTC (~13 FPS normal, ~8 FPS si CPU pesada)
  const targetFrameIntervalMsRef = useRef<number>(75);
  const inferenceDurationEmaRef = useRef<number>(20);
  const lastFaceDetectedRef = useRef<boolean>(false);
  const lastCalibratedRef = useRef<boolean>(false);

  // 1. Inicialización del proveedor Adapter (Singleton compartido)
  useEffect(() => {
    let isCancelled = false;
    const provider = MediaPipeFaceProvider.getInstance();
    providerRef.current = provider;

    provider
      .initialize()
      .then(() => {
        if (!isCancelled) setIsModelReady(true);
      })
      .catch((err) => {
        console.warn("[useFacialBehaviorAnalyzer] No se pudo inicializar MediaPipe:", err);
      });

    return () => {
      isCancelled = true;
      provider.dispose();
      providerRef.current = null;
    };
  }, []);

  // 2. Control de Cámara getUserMedia
  useEffect(() => {
    if (!isEnabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 20 },
          },
          audio: false,
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        if (!isSubscribed) return;
        console.warn("[useFacialBehaviorAnalyzer] Error al acceder a cámara:", err);
        const errName = err instanceof Error ? err.name : "";
        setCameraError(
          errName === "NotAllowedError" || errName === "PermissionDeniedError"
            ? "Permiso de cámara denegado. La entrevista continuará en modo solo audio."
            : "No se pudo iniciar la cámara."
        );
        setHasPermission(false);
      }
    }

    startCamera();

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setHasPermission(false);
      setFaceDetected(false);
    };
  }, [isEnabled]);

  // 3. Proyección matemática exacta de la Malla 3D sobre video object-cover
  const drawLandmarks = useCallback((landmarks: FaceLandmarkPoint[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || landmarks.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sincronizar dimensiones visibles reales
    const rect = video.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Transformación precisa de object-cover
    const videoW = video.videoWidth || 640;
    const videoH = video.videoHeight || 480;
    const videoAspect = videoW / videoH;
    const canvasAspect = canvas.width / canvas.height;

    let renderW = canvas.width;
    let renderH = canvas.height;
    let offX = 0;
    let offY = 0;

    if (canvasAspect > videoAspect) {
      renderH = canvas.width / videoAspect;
      offY = (canvas.height - renderH) / 2;
    } else {
      renderW = canvas.height * videoAspect;
      offX = (canvas.width - renderW) / 2;
    }

    // Proyección con espejo horizontal (scale-x-[-1])
    const toPx = (pt: FaceLandmarkPoint) => ({
      x: offX + (1 - pt.x) * renderW,
      y: offY + pt.y * renderH,
    });

    // Helper para trazar cadenas de líneas
    const drawPath = (indices: number[], color: string, lineWidth = 1.5) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * dpr;
      let first = true;
      for (const idx of indices) {
        const pt = landmarks[idx];
        if (!pt) continue;
        const screen = toPx(pt);
        if (first) {
          ctx.moveTo(screen.x, screen.y);
          first = false;
        } else {
          ctx.lineTo(screen.x, screen.y);
        }
      }
      ctx.stroke();
    };

    // 1. Contorno Facial
    drawPath(FACE_OVAL_INDICES, "rgba(99, 102, 241, 0.45)", 1.2);

    // 2. Ojos y Cejas
    drawPath(LEFT_EYE_INDICES, "rgba(165, 180, 252, 0.75)", 1.5);
    drawPath(RIGHT_EYE_INDICES, "rgba(165, 180, 252, 0.75)", 1.5);
    drawPath(LEFT_EYEBROW_INDICES, "rgba(129, 140, 248, 0.7)", 1.5);
    drawPath(RIGHT_EYEBROW_INDICES, "rgba(129, 140, 248, 0.7)", 1.5);

    // 3. Labios
    drawPath(LIPS_OUTER_INDICES, "rgba(244, 114, 182, 0.65)", 1.5);

    // 4. Centros de Iris (puntos 468 y 473)
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];
    ctx.fillStyle = "rgba(52, 211, 153, 0.9)"; // Esmeralda
    if (leftIris) {
      const p = toPx(leftIris);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    if (rightIris) {
      const p = toPx(rightIris);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // 4. Bucle desacoplado de inferencia por frame a 15–20 FPS adaptativos
  useEffect(() => {
    if (!isEnabled || !isModelReady || !hasPermission) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    let isRunning = true;

    const processFrame = (now: number) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const provider = providerRef.current;

      const elapsedSinceLast = now - lastProcessedTimeRef.current;
      if (
        video &&
        video.readyState >= 2 &&
        provider &&
        provider.isReady() &&
        elapsedSinceLast >= targetFrameIntervalMsRef.current
      ) {
        lastProcessedTimeRef.current = now;
        const inferStart = performance.now();

        const rawResult = provider.detect(video, now);
        if (rawResult.faceDetected !== lastFaceDetectedRef.current) {
          lastFaceDetectedRef.current = rawResult.faceDetected;
          setFaceDetected(rawResult.faceDetected);
        }

        const inferDuration = performance.now() - inferStart;
        // EMA de tiempo de inferencia para pacing adaptativo (prioriza audio WebRTC)
        inferenceDurationEmaRef.current =
          0.85 * inferenceDurationEmaRef.current + 0.15 * inferDuration;

        if (inferenceDurationEmaRef.current > 28) {
          // Si MediaPipe corre en CPU o carga alta, reducimos a ~8 FPS para no frenar el audio
          targetFrameIntervalMsRef.current = 125;
        } else {
          // Fluidez estable a ~13 FPS (~75ms)
          targetFrameIntervalMsRef.current = 75;
        }

        // Malla 3D en vivo
        if (showMeshOverlayRef.current && canvasRef.current) {
          if (rawResult.faceDetected) {
            drawLandmarks(rawResult.landmarks);
          } else {
            const ctx = canvasRef.current.getContext("2d");
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }

        if (rawResult.faceDetected) {
          const sample: FacialFrameSample = {
            timestamp: now,
            faceDetected: true,
            blendshapes: rawResult.blendshapes,
            headAngles: rawResult.headAngles,
            centroid: rawResult.landmarks[1]
              ? { x: rawResult.landmarks[1].x, y: rawResult.landmarks[1].y }
              : { x: 0.5, y: 0.5 },
            irisGaze: rawResult.irisGaze,
            interocularDistance: rawResult.interocularDistance,
            isSpeaking: isSpeakingRef.current,
          };

          const newCue = aggregatorRef.current.addSample(
            sample,
            elapsedSecondsRef.current,
            currentTranscriptSnippetRef.current
          );

          if (newCue) {
            setLiveCue(newCue);
            setTimeout(() => {
              setLiveCue((prev) => (prev?.id === newCue.id ? null : prev));
            }, 5500);
          }

          const calibratedNow = aggregatorRef.current.getCalibrated();
          if (calibratedNow !== lastCalibratedRef.current) {
            lastCalibratedRef.current = calibratedNow;
            setIsCalibrated(calibratedNow);
          }

          // Actualizar liveScores en O(1) cada 1000ms solo si hay cambios reales
          if (now - lastScoreUpdateTimeRef.current >= 1000) {
            lastScoreUpdateTimeRef.current = now;
            const snapshot: LiveFacialSnapshot = aggregatorRef.current.getLiveSnapshot();
            setLiveScores((prev) => {
              if (
                prev.composure === snapshot.composure &&
                prev.eyeContact === snapshot.eyeContact &&
                prev.gestureBalance === snapshot.gestureBalance &&
                prev.postureStability === snapshot.postureStability &&
                prev.warmth === snapshot.warmth
              ) {
                return prev;
              }
              return {
                composure: snapshot.composure,
                eyeContact: snapshot.eyeContact,
                gestureBalance: snapshot.gestureBalance,
                postureStability: snapshot.postureStability,
                warmth: snapshot.warmth,
              };
            });
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isEnabled, isModelReady, hasPermission, drawLandmarks]);

  // Recalibración manual guiada
  const triggerRecalibration = useCallback(() => {
    aggregatorRef.current.resetCalibration();
    lastCalibratedRef.current = false;
    setIsCalibrated(false);
  }, []);

  // 5. Finalizar telemetría completa al terminar llamada
  const finalizeSummary = useCallback((): FacialTelemetrySummary => {
    if (!isEnabled || !hasPermission) {
      return {
        enabled: false,
        durationSeconds: elapsedSecondsRef.current,
        sampledFrames: 0,
        validFaceFrames: 0,
        facePresenceRatio: 0,
        calibrated: false,
        scores: {
          overallPresence: 70,
          eyeContact: 70,
          composure: 70,
          gestureBalance: 70,
          postureStability: 70,
          warmth: 70,
        },
        indicators: {
          avgTensionIndex: 0.18,
          gestureProfile: "natural",
          blinkRatePerMin: 16,
          headMovementVolatility: 2.5,
          speakingVsListening: {
            speakingTensionAvg: 0.18,
            listeningEyeContactAvg: 70,
          },
        },
        timeline: [],
        peakEvents: [],
      };
    }

    return aggregatorRef.current.finalizeSummary(elapsedSecondsRef.current);
  }, [isEnabled, hasPermission]);

  return {
    videoRef,
    canvasRef,
    isModelReady,
    isCalibrated,
    faceDetected,
    liveCue,
    cameraError,
    hasPermission,
    liveScores,
    triggerRecalibration,
    finalizeSummary,
  };
}
