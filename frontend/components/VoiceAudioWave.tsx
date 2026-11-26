/*
 * Adapted from react-audio-visualize by Samhir Tarif
 * https://github.com/samhirtarif/react-audio-visualize
 * MIT License, Copyright (c) Samhir Tarif
 *
 * Ported directly to React 19 (avoiding react-audio-visualize@1.2.0's bundled
 * React 18 ReactCurrentDispatcher internals) and wired directly to LiveKit
 * MediaStreamTrack via Web Audio AnalyserNode without MediaRecorder overhead.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface VoiceAudioWaveProps {
  audioTrack: MediaStreamTrack | null;
  isActive: boolean;
  isMuted?: boolean;
  variant?: "agent" | "candidate";
  label?: string;
  width?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
  fftSize?: 64 | 128 | 256 | 512 | 1024 | 2048;
  minDecibels?: number;
  maxDecibels?: number;
  smoothingTimeConstant?: number;
  className?: string;
}

function calculateBarData(
  frequencyData: Uint8Array,
  width: number,
  barWidth: number,
  gap: number
): number[] {
  let units = Math.floor(width / (barWidth + gap));
  if (units <= 0) return [];
  let step = Math.floor(frequencyData.length / units);

  if (units > frequencyData.length || step < 1) {
    units = Math.min(units, frequencyData.length);
    step = 1;
  }

  const data: number[] = [];
  for (let i = 0; i < units; i++) {
    let sum = 0;
    let count = 0;
    for (let j = 0; j < step && i * step + j < frequencyData.length; j++) {
      sum += frequencyData[i * step + j];
      count++;
    }
    data.push(count > 0 ? sum / count : 0);
  }
  return data;
}

function drawBars(
  data: number[],
  canvas: HTMLCanvasElement,
  barWidth: number,
  gap: number,
  barColor: string
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  const centerY = height / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = barColor;

  const totalWidth = data.length * (barWidth + gap) - gap;
  const startX = Math.max(0, (width - totalWidth) / 2);

  data.forEach((dp, i) => {
    const normalized = dp / 255;
    const barHeight = Math.max(2, normalized * (height - 4));
    const x = startX + i * (barWidth + gap);
    const y = centerY - barHeight / 2;

    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, barWidth, barHeight, 50);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  });
}

export default function VoiceAudioWave({
  audioTrack,
  isActive,
  isMuted = false,
  variant = "candidate",
  label,
  width = 240,
  height = 34,
  barWidth = 3,
  gap = 2,
  fftSize = 512,
  minDecibels = -85,
  maxDecibels = -15,
  smoothingTimeConstant = 0.65,
  className,
}: VoiceAudioWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const isAgent = variant === "agent";
  const barColor = isAgent ? "#a5b4fc" : "#34d399";
  const canRenderWave =
    Boolean(audioTrack) &&
    audioTrack?.readyState === "live" &&
    isActive &&
    !isMuted &&
    !reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canRenderWave || !audioTrack || !canvas) return;

    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    let rafId = 0;
    let disposed = false;
    const audioCtx = new AudioCtx();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;
    analyser.smoothingTimeConstant = smoothingTimeConstant;

    let source: MediaStreamAudioSourceNode | null = null;
    try {
      const stream = new MediaStream([audioTrack]);
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    } catch (err) {
      console.warn("[VoiceAudioWave] Could not attach Web Audio analyser:", err);
      audioCtx.close().catch(() => {});
      return;
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    const renderFrame = () => {
      if (disposed) return;
      if (audioTrack.readyState !== "live") {
        drawBars(
          new Array(Math.max(1, Math.floor(canvas.width / (barWidth + gap)))).fill(0),
          canvas,
          barWidth,
          gap,
          barColor
        );
        return;
      }

      analyser.getByteFrequencyData(frequencyData);
      // Focus on the lower-to-mid voice spectrum (first ~55% of FFT bins) for expressive speech bars
      const voiceSlice = frequencyData.subarray(0, Math.max(16, Math.floor(frequencyData.length * 0.55)));
      const bars = calculateBarData(voiceSlice, canvas.width, barWidth, gap);
      drawBars(bars, canvas, barWidth, gap, barColor);
      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      disposed = true;
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      try {
        source?.disconnect();
        analyser.disconnect();
      } catch {
        // ignore disconnect errors
      }
      if (audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [
    audioTrack,
    barColor,
    barWidth,
    canRenderWave,
    fftSize,
    gap,
    maxDecibels,
    minDecibels,
    smoothingTimeConstant,
  ]);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2 rounded-full border backdrop-blur-xl transition-colors",
        isMuted
          ? "bg-rose-500/[0.06] border-rose-500/20"
          : isAgent
          ? "bg-white/[0.03] border-white/[0.08]"
          : "bg-emerald-500/[0.05] border-emerald-500/20",
        className
      )}
    >
      {label && (
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              isMuted
                ? "bg-rose-400"
                : isAgent
                ? "bg-indigo-400 animate-pulse"
                : "bg-emerald-400 animate-pulse"
            )}
          />
          <span className="text-[11px] font-medium tracking-[-0.01em] text-zinc-300 whitespace-nowrap">
            {label}
          </span>
        </div>
      )}

      <div
        aria-hidden="true"
        className="flex-1 flex items-center justify-center overflow-hidden"
        style={{ minHeight: height }}
      >
        {canRenderWave ? (
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="block max-w-full"
            style={{ width: "100%", maxWidth: width, height }}
          />
        ) : (
          <div className="w-full flex items-center justify-center">
            <div
              className={cn(
                "h-[1.5px] w-full max-w-[220px] rounded-full transition-colors",
                isMuted
                  ? "bg-rose-400/35"
                  : isAgent
                  ? "bg-indigo-300/25"
                  : "bg-emerald-400/30"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
