"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Camera,
  CameraOff,
  Eye,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ScanFace,
} from "lucide-react";
import { LiveCoachingCue } from "@/lib/facial/types";

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
}) => {
  return (
    <div className="relative w-full rounded-2xl bg-[#0b0d14] border border-white/[0.08] shadow-xl overflow-hidden flex flex-col justify-between min-h-[260px] md:min-h-[300px]">
      {/* ── 1. Header de Cámara y Controles ── */}
      <div className="relative z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-1.5 rounded-lg border",
              isEnabled && hasPermission
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-400"
            )}
          >
            {isEnabled && hasPermission ? (
              <Camera className="w-3.5 h-3.5" />
            ) : (
              <CameraOff className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">Análisis Facial IA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Edge AI
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% privado en navegador
            </p>
          </div>
        </div>

        {/* Toggle de Malla 3D (Demo Mode) */}
        {isEnabled && hasPermission && (
          <button
            type="button"
            onClick={onToggleMeshOverlay}
            className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition border cursor-pointer",
              showMeshOverlay
                ? "bg-indigo-600/30 text-indigo-200 border-indigo-500/40"
                : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            )}
            title="Activar o desactivar visualización de puntos de malla facial"
          >
            <ScanFace className="w-3 h-3" />
            <span>{showMeshOverlay ? "Malla 3D ON" : "Malla 3D"}</span>
          </button>
        )}
      </div>

      {/* ── 2. Área de Video / Cámara ── */}
      <div className="relative flex-1 w-full flex items-center justify-center bg-[#07080d] overflow-hidden">
        {isEnabled ? (
          <>
            {/* Video en espejo */}
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

            {/* Canvas de Malla Facial (si está activado) */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={cn(
                "absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200",
                showMeshOverlay && hasPermission ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Estado de Calibración inicial */}
            {hasPermission && faceDetected && !isCalibrated && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 text-[11px] shadow-lg backdrop-blur-md animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Calibrando expresión neutra...</span>
              </div>
            )}

            {/* Error o Sin Permiso */}
            {cameraError && (
              <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center max-w-xs">
                <AlertCircle className="w-8 h-8 text-amber-400" />
                <p className="text-xs text-zinc-300">{cameraError}</p>
                <button
                  type="button"
                  onClick={onToggleEnabled}
                  className="mt-1 px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition cursor-pointer"
                >
                  Continuar solo audio
                </button>
              </div>
            )}

            {/* Rostro no visible */}
            {hasPermission && !faceDetected && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-zinc-300 text-xs backdrop-blur-sm flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Centra tu rostro en la cámara</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Cámara Desactivada (Modo Solo Audio) */
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center select-none">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <CameraOff className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-300">Cámara Desactivada</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mt-0.5">
                Activa la cámara para recibir evaluación de postura, serenidad y contacto visual con IA.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleEnabled}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow cursor-pointer"
            >
              Activar Cámara
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Footer / Live HUD Nudges ── */}
      {isEnabled && hasPermission && (
        <div className="relative z-10 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-2 border-t border-white/[0.05]">
          {/* Nudge / Alerta en vivo (con histéresis y cooldown) */}
          {liveCue ? (
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md animate-fadeIn",
                liveCue.severity === "warning"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-200"
                  : "bg-indigo-500/20 border border-indigo-500/40 text-indigo-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="truncate">{liveCue.text}</span>
            </div>
          ) : faceDetected ? (
            /* Indicador de estado sutil en reposo */
            <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-300">
                  {liveScores.composure >= 75 ? "Expresión serena" : "Tensión moderada"}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-zinc-600">•</span>
                <span>Contacto visual: {liveScores.eyeContact}%</span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-zinc-500 italic">Buscando rostro...</div>
          )}

          {/* Botón rápido para apagar cámara */}
          <button
            type="button"
            onClick={onToggleEnabled}
            className="text-[10px] text-zinc-400 hover:text-rose-400 transition cursor-pointer shrink-0 ml-auto"
          >
            Desactivar
          </button>
        </div>
      )}
    </div>
  );
};
