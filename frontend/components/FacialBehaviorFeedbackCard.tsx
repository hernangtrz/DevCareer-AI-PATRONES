"use client";

import React, { useState } from "react";
import {
  ScanFace,
  Eye,
  Activity,
  Smile,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Sparkles,
} from "lucide-react";

interface FacialBehaviorFeedbackCardProps {
  facialFeedback: {
    overallScore: number;
    expressiveProfile: string;
    summaryComment: string;
    metrics: {
      eyeContact: number;
      composure: number;
      gestureBalance: number;
      postureStability: number;
      warmth: number;
      blinkRatePerMin: number;
      facePresencePercent: number;
    };
    strengths: string[];
    habitsToImprove: string[];
    coachingTips: string[];
    keyMoments: Array<{
      timestampSec: number;
      label: string;
      observation: string;
    }>;
    timeline: Array<{
      second: number;
      tension: number;
      eyeContact: number;
      gestureIntensity: number;
      warmth: number;
      speaker: "user" | "agent";
    }>;
  };
}

export const FacialBehaviorFeedbackCard: React.FC<FacialBehaviorFeedbackCardProps> = ({
  facialFeedback,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<{
    second: number;
    tension: number;
    eyeContact: number;
  } | null>(null);

  const { overallScore, expressiveProfile, summaryComment, metrics, strengths, habitsToImprove, coachingTips, keyMoments, timeline } =
    facialFeedback;

  const formatSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Dimensiones para gráfico SVG de Timeline
  const svgWidth = 600;
  const svgHeight = 140;
  const paddingX = 40;
  const paddingY = 20;

  const maxSec = timeline && timeline.length > 0 ? timeline[timeline.length - 1].second : 60;

  const getSvgX = (sec: number) => {
    if (maxSec <= 0) return paddingX;
    return paddingX + (sec / maxSec) * (svgWidth - paddingX * 2);
  };

  const getSvgY = (val: number) => {
    // Escala 0 a 100 invertida en SVG
    const clamped = Math.max(0, Math.min(100, val));
    return svgHeight - paddingY - (clamped / 100) * (svgHeight - paddingY * 2);
  };

  // Construir paths para Tensión y Contacto Visual
  const tensionPath =
    timeline && timeline.length > 1
      ? timeline.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${getSvgX(pt.second)} ${getSvgY(pt.tension)}`, "")
      : "";

  const eyeContactPath =
    timeline && timeline.length > 1
      ? timeline.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${getSvgX(pt.second)} ${getSvgY(pt.eyeContact)}`, "")
      : "";

  return (
    <div className="relative overflow-hidden w-full bg-gradient-to-br from-[#0c0e18] via-[#090b14] to-[#07080f] border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-2xl text-left mt-8">
      {/* Resplandor decorativo */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

      {/* ── 1. Encabezado Principal ── */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner shrink-0">
            <ScanFace className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Evaluación de Lenguaje No Verbal & Presencia
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                MediaPipe Edge AI
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Diagnóstico de micro-expresiones FACS, tensión postural y contacto visual</span>
            </p>
          </div>
        </div>

        {/* Insignia de Score Global No Verbal */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              {expressiveProfile}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">{overallScore}</span>
              <span className="text-xs text-zinc-500 font-semibold">/100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── 2. Resumen Ejecutivo del Coach IA ── */}
      <div className="relative z-10 my-6 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
        <p className="text-sm text-zinc-200 italic leading-relaxed">
          &ldquo;{summaryComment}&rdquo;
        </p>
      </div>

      {/* ── 3. Grid de 5 Dimensiones Conductuales ── */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-6">
        {/* Contacto Visual */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Contacto Visual</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{metrics.eyeContact}</span>
            <span className="text-xs text-zinc-500">/100</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${metrics.eyeContact}%` }}
            />
          </div>
        </div>

        {/* Control de Tensión */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Control de Tensión</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{metrics.composure}</span>
            <span className="text-xs text-zinc-500">/100</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${metrics.composure}%` }}
            />
          </div>
        </div>

        {/* Equilibrio Gestual */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Equilibrio Gestual</span>
            <ScanFace className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{metrics.gestureBalance}</span>
            <span className="text-xs text-zinc-500">/100</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${metrics.gestureBalance}%` }}
            />
          </div>
        </div>

        {/* Estabilidad Postural */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Estabilidad Postural</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{metrics.postureStability}</span>
            <span className="text-xs text-zinc-500">/100</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${metrics.postureStability}%` }}
            />
          </div>
        </div>

        {/* Calidez & Empatía */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Calidez Expresiva</span>
            <Smile className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{metrics.warmth}</span>
            <span className="text-xs text-zinc-500">/100</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${metrics.warmth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Indicadores complementarios (Parpadeo y Encuadre) */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 mb-6">
        <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tasa de Parpadeo:</span>
          <strong className="text-white">{metrics.blinkRatePerMin} / min</strong>
          <span className="text-zinc-500 text-[10px]">(Rango ideal: 14-22)</span>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Presencia en Encuadre:</span>
          <strong className="text-white">{metrics.facePresencePercent}% de la llamada</strong>
        </div>
      </div>

      {/* ── 4. Gráfico Evolutivo de Línea de Tiempo (SVG Nativo) ── */}
      {timeline && timeline.length > 1 && (
        <div className="relative z-10 my-6 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Evolución de Tensión vs Contacto Visual en la Llamada
              </h3>
              <p className="text-[11px] text-zinc-500">
                Línea índigo: Tensión facial (%) • Línea cian: Contacto visual (%)
              </p>
            </div>
            {selectedPoint && (
              <div className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200">
                Min {formatSec(selectedPoint.second)} | Tensión: {selectedPoint.tension}% | Mirada: {selectedPoint.eyeContact}%
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto no-scrollbar">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-36 min-w-[500px]"
            >
              {/* Ejes de referencia */}
              <line
                x1={paddingX}
                y1={getSvgY(75)}
                x2={svgWidth - paddingX}
                y2={getSvgY(75)}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
              <line
                x1={paddingX}
                y1={getSvgY(50)}
                x2={svgWidth - paddingX}
                y2={getSvgY(50)}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />

              {/* Curvas de datos */}
              <path
                d={tensionPath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={eyeContactPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Puntos interactivos */}
              {timeline.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={getSvgX(pt.second)}
                  cy={getSvgY(pt.tension)}
                  r={4}
                  className="fill-indigo-400 hover:fill-white cursor-pointer transition"
                  onMouseEnter={() => setSelectedPoint(pt)}
                />
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* ── 5. Momentos Clave Identificados ── */}
      {keyMoments && keyMoments.length > 0 && (
        <div className="relative z-10 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Momentos Clave Observados en la Sesión
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {keyMoments.map((km, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs flex items-start gap-2.5"
              >
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 font-mono text-[10px] shrink-0">
                  {formatSec(km.timestampSec)}
                </span>
                <div>
                  <strong className="text-zinc-200 block">{km.label}</strong>
                  <p className="text-zinc-400 text-[11px] mt-0.5">{km.observation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Fortalezas, Hábitos y Plan de Coaching ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fortalezas */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Fortalezas No Verbales
          </h4>
          <ul className="text-xs text-zinc-300 space-y-1.5 pl-0 list-none mt-1">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hábitos a Mejorar */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Hábitos a Corregir
          </h4>
          <ul className="text-xs text-zinc-300 space-y-1.5 pl-0 list-none mt-1">
            {habitsToImprove.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">!</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ejercicios de Coaching */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4" />
            Ejercicios Prácticos
          </h4>
          <ul className="text-xs text-zinc-300 space-y-1.5 pl-0 list-none mt-1">
            {coachingTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold shrink-0">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
