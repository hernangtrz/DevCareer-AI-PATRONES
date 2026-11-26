"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Camera,
  CameraOff,
  Eye,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ScanFace,
  RotateCcw,
} from "lucide-react";
import { LiveCoachingCue } from "@/lib/facial/types";
import {
  MOTION_TRANSITION,
  resolveMotionTransition,
} from "@/lib/motion-tokens";

interface FacialMonitorPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  hasPermission: boolean;
  isCalibrated: boolean;
  faceDetected: boolean;
  cameraError: string | null;
  liveCue: LiveCoachingCue | null;
  liveScores: {
    composure: number;
    eyeContact: number;
    gestureBalance: number;
  };
  showMeshOverlay: boolean;
  onToggleMeshOverlay: () => void;
  onRecalibrate?: () => void;
}

export const FacialMonitorPanel: React.FC<FacialMonitorPanelProps> = ({
  videoRef,
  canvasRef,
  isEnabled,
  onToggleEnabled,
  hasPermission,
  isCalibrated,
  faceDetected,
  cameraError,
  liveCue,
  liveScores,
  showMeshOverlay,
  onToggleMeshOverlay,
  onRecalibrate,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const hudTransition = resolveMotionTransition(
    prefersReducedMotion,
    MOTION_TRANSITION.smooth
  );

  return (
    <div className="relative w-full h-full min-h-[300px] md:min-h-[340px] rounded-[24px] bg-[#080a12] border border-white/[0.08] ring-1 ring-inset ring-white/[0.05] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col justify-between">
      {/* Subtle 1px top specular hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent"
      />

      {/* ── Edge-to-Edge Camera Viewport ── */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0b0e18] to-[#06070d]">
        {isEnabled ? (
          <>
            {/* Mirrored Live Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={cn(
                "absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300",
                hasPermission ? "opacity-100" : "opacity-0"
              )}
            />

            {/* 3D Facial Mesh Canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={cn(
                "absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200",
                showMeshOverlay && hasPermission ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Soft edge vignettes for legible floating glass HUD */}
            {hasPermission && (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 via-black/25 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                />
              </>
            )}

            {/* Calibration Pill */}
            <AnimatePresence>
              {hasPermission && faceDetected && !isCalibrated && (
                <motion.div
                  key="calibrating"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={hudTransition}
                  className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0e111d]/85 border border-indigo-400/30 text-indigo-100 text-[11px] font-medium shadow-lg backdrop-blur-xl whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
                  <span>Calibrando expresión neutra…</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera Error State */}
            {cameraError && (
              <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center max-w-xs">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-xs leading-relaxed text-zinc-300">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={onToggleEnabled}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/[0.08] border border-white/[0.12] text-white hover:bg-white/[0.14] transition cursor-pointer"
                >
                  Continuar solo audio
                </button>
              </div>
            )}

            {/* Face Not Visible Hint */}
            {hasPermission && !faceDetected && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="px-3.5 py-2 rounded-full bg-black/65 border border-white/[0.12] text-zinc-200 text-xs font-medium backdrop-blur-xl flex items-center gap-2 shadow-lg">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Centra tu rostro en la cámara</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Camera Disabled State (Audio-Only) */
          <div className="relative z-10 flex flex-col items-center justify-center gap-3.5 p-6 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">
              <CameraOff className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium tracking-[-0.01em] text-zinc-100">
                Cámara desactivada
              </p>
              <p className="text-xs text-zinc-400 max-w-[240px] leading-relaxed">
                Actívala para evaluar postura, serenidad y contacto visual en local.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleEnabled}
              className="px-4 py-2 rounded-full text-xs font-medium bg-indigo-500/90 hover:bg-indigo-400 text-white transition shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              Activar cámara
            </button>
          </div>
        )}
      </div>

      {/* ── 1. Floating Top Glass HUD ── */}
      <div className="relative z-10 flex items-center justify-between gap-2 p-3">
        {/* Privacy & Edge AI Pill */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 border border-white/[0.10] backdrop-blur-xl"
          title="Análisis facial Edge AI ejecutado 100% de forma privada en tu navegador"
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              isEnabled && hasPermission
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]"
                : "bg-zinc-500"
            )}
          />
          <span className="text-[11px] font-medium text-white tracking-[-0.01em] whitespace-nowrap">
            Edge AI
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-300/90 border-l border-white/[0.12] pl-2 whitespace-nowrap">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Privado
          </span>
        </div>

        {/* Compact Top-Right Controls: Recalibrate & 3D Mesh */}
        {isEnabled && hasPermission && (
          <div className="flex items-center gap-1.5">
            {onRecalibrate && (
              <button
                type="button"
                onClick={onRecalibrate}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-black/55 border border-white/[0.10] text-zinc-200 hover:bg-black/75 hover:text-white backdrop-blur-xl transition cursor-pointer whitespace-nowrap"
                title="Recalibrar expresión neutra y centro de mirada si cambiaste de postura"
              >
                <RotateCcw className="w-3 h-3 text-indigo-300" />
                <span className="hidden sm:inline">Recalibrar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onToggleMeshOverlay}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium backdrop-blur-xl transition border cursor-pointer whitespace-nowrap",
                showMeshOverlay
                  ? "bg-indigo-500/30 text-indigo-100 border-indigo-400/45 shadow-[0_0_16px_-4px_rgba(99,102,241,0.6)]"
                  : "bg-black/55 text-zinc-300 border-white/[0.10] hover:bg-black/75 hover:text-white"
              )}
              title="Activar o desactivar visualización de puntos de malla facial"
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>{showMeshOverlay ? "Malla ON" : "Malla 3D"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Floating Bottom Telemetry Bar ── */}
      {isEnabled && hasPermission && (
        <div className="relative z-10 p-3 mt-auto">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-black/60 border border-white/[0.10] backdrop-blur-xl">
            <AnimatePresence mode="wait">
              {liveCue ? (
                <motion.div
                  key={`cue-${liveCue.text}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={hudTransition}
                  className={cn(
                    "flex items-center gap-2 text-[11px] font-medium min-w-0",
                    liveCue.severity === "warning"
                      ? "text-amber-200"
                      : "text-indigo-200"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse shrink-0",
                      liveCue.severity === "warning"
                        ? "bg-amber-400"
                        : "bg-indigo-400"
                    )}
                  />
                  <span className="truncate">{liveCue.text}</span>
                </motion.div>
              ) : faceDetected ? (
                <motion.div
                  key="telemetry-live"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={hudTransition}
                  className="flex items-center gap-2.5 text-[11px] text-zinc-300 min-w-0"
                >
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        liveScores.composure >= 75
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      )}
                    />
                    <span className="text-zinc-100 font-medium">
                      {liveScores.composure >= 75
                        ? "Expresión serena"
                        : "Tensión moderada"}
                    </span>
                  </span>
                  <span className="hidden sm:inline text-white/20">·</span>
                  <span className="hidden sm:inline text-zinc-400 tabular-nums whitespace-nowrap">
                    Mirada{" "}
                    <strong className="font-semibold text-zinc-200">
                      {liveScores.eyeContact}%
                    </strong>
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="telemetry-searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={hudTransition}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-400"
                >
                  <Camera className="w-3 h-3 text-zinc-500" />
                  <span>Buscando rostro…</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={onToggleEnabled}
              className="text-[11px] font-medium text-zinc-400 hover:text-rose-300 transition cursor-pointer shrink-0 pl-2 border-l border-white/[0.10] whitespace-nowrap"
            >
              Ocultar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
