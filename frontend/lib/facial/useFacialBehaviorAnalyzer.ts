"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MediaPipeFaceProvider } from "./mediapipe-face.provider";
import { FacialBehaviorAggregator } from "./facial-behavior.aggregator";
import {
  LiveCoachingCue,
  FacialTelemetrySummary,
  FacialFrameSample,
  FaceLandmarkPoint,
} from "./types";

interface UseFacialBehaviorAnalyzerProps {
  isEnabled: boolean;
  isCallActive: boolean;
  isSpeaking: boolean;
  elapsedSeconds: number;
  currentTranscriptSnippet?: string;
  showMeshOverlay?: boolean;
}

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
    composure: 85,
    eyeContact: 85,
    gestureBalance: 85,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);
  const TARGET_FPS = 7;
  const FRAME_INTERVAL_MS = 1000 / TARGET_FPS; // ~142ms por frame (Edge AI optimizado)

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
            frameRate: { ideal: 15 },
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

  // 3. Dibujo de contornos en canvas para Modo Demostración
  const drawLandmarks = useCallback((landmarks: FaceLandmarkPoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas || landmarks.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar puntos clave sutiles (ojos, cejas, labios, contorno)
    ctx.fillStyle = "rgba(165, 180, 252, 0.65)"; // indigo-300 traslúcido
    const keyIndices = [1, 33, 133, 263, 362, 61, 291, 199, 10, 152];

    for (const idx of keyIndices) {
      const pt = landmarks[idx];
      if (!pt) continue;
      const px = (1 - pt.x) * canvas.width; // Espejo horizontal
      const py = pt.y * canvas.height;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, []);

  // 4. Bucle throttled de inferencia por frame
  useEffect(() => {
    if (!isEnabled || !isModelReady || !hasPermission || !isCallActive) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    let isRunning = true;

    const processFrame = (now: number) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const provider = providerRef.current;

      if (
        video &&
        video.readyState >= 2 &&
        provider &&
        provider.isReady() &&
        now - lastProcessedTimeRef.current >= FRAME_INTERVAL_MS
      ) {
        lastProcessedTimeRef.current = now;

        const rawResult = provider.detect(video, now);
        setFaceDetected(rawResult.faceDetected);

        if (showMeshOverlay && canvasRef.current) {
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
            isSpeaking,
          };

          const newCue = aggregatorRef.current.addSample(
            sample,
            elapsedSeconds,
            currentTranscriptSnippet
          );

          if (newCue) {
            setLiveCue(newCue);
            // Auto-ocultar alerta visual a los 6 segundos
            setTimeout(() => {
              setLiveCue((prev) => (prev?.id === newCue.id ? null : prev));
            }, 6000);
          }

          setIsCalibrated(aggregatorRef.current.getCalibrated());

          // Actualizar liveScores cada 2 segundos para retroalimentación visual sutil
          if (elapsedSeconds % 2 === 0) {
            const currentSummary = aggregatorRef.current.finalizeSummary(elapsedSeconds || 1);
            setLiveScores({
              composure: currentSummary.scores.composure,
              eyeContact: currentSummary.scores.eyeContact,
              gestureBalance: currentSummary.scores.gestureBalance,
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
  }, [
    isEnabled,
    isModelReady,
    hasPermission,
    isCallActive,
    isSpeaking,
    elapsedSeconds,
    currentTranscriptSnippet,
    showMeshOverlay,
    drawLandmarks,
    FRAME_INTERVAL_MS,
  ]);

  // 5. Finalizar telemetría completa
  const finalizeSummary = useCallback((): FacialTelemetrySummary => {
    if (!isEnabled || !hasPermission) {
      return {
        enabled: false,
        durationSeconds: elapsedSeconds,
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
          avgTensionIndex: 0.2,
          gestureProfile: "natural",
          blinkRatePerMin: 16,
          headMovementVolatility: 2.5,
          speakingVsListening: {
            speakingTensionAvg: 0.2,
            listeningEyeContactAvg: 70,
          },
        },
        timeline: [],
        peakEvents: [],
      };
    }

    return aggregatorRef.current.finalizeSummary(elapsedSeconds);
  }, [isEnabled, hasPermission, elapsedSeconds]);

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
    finalizeSummary,
  };
}
