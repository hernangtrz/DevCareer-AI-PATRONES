"use client";

import React, { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Target, Eye, EyeOff } from "lucide-react";

export interface WeeklyPointItem {
  day: string;
  score: number;
  target: number;
}

export interface RadarPillarItem {
  label: string;
  score: number;
  benchmark: number;
}

interface AnalyticsRechartsPairProps {
  weeklyProgress: WeeklyPointItem[];
  radarAxes: RadarPillarItem[];
  chartAnimKey?: number;
}

interface BarTooltipPayload {
  payload?: {
    displayLabel: string;
    day: string;
    score: number;
    target: number;
  };
}

interface RadarTooltipPayload {
  payload?: {
    fullLabel: string;
    shortLabel: string;
    score: number;
    benchmark: number;
  };
}

function shortenRadarLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length <= 16) return trimmed;
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) return `${words[0]} ${words[1]}`;
  return `${trimmed.slice(0, 14)}…`;
}

function WeeklyBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: BarTooltipPayload[];
}) {
  if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  const target = item.target || 75;
  const delta = item.score - target;
  const passed = item.score >= target;

  return (
    <div className="px-3.5 py-2.5 rounded-xl bg-[#0b0d17]/95 border border-indigo-500/35 shadow-2xl shadow-black/60 backdrop-blur-md text-xs">
      <p className="font-bold text-white mb-1">{item.displayLabel}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-zinc-400">Puntaje:</span>
        <span
          className={`font-mono font-extrabold ${
            passed ? "text-emerald-400" : "text-indigo-300"
          }`}
        >
          {item.score} / 100
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-zinc-400">Meta ({target}):</span>
        <span
          className={`font-mono font-bold ${
            delta >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {delta >= 0 ? `+${delta} pts` : `${delta} pts`}
        </span>
      </div>
    </div>
  );
}

function SkillRadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: RadarTooltipPayload[];
}) {
  if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  const diff = item.score - item.benchmark;

  return (
    <div className="px-3.5 py-2.5 rounded-xl bg-[#0b0d17]/95 border border-indigo-500/35 shadow-2xl shadow-black/60 backdrop-blur-md text-xs min-w-[185px]">
      <p className="font-bold text-white mb-1.5">{item.fullLabel}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          Tu puntaje:
        </span>
        <span className="font-mono font-extrabold text-indigo-300">
          {item.score} pts
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 mt-1">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-zinc-400" />
          Meta industria:
        </span>
        <span className="font-mono font-semibold text-zinc-300">
          {item.benchmark} pts
        </span>
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-zinc-400">Brecha:</span>
        <span
          className={`font-mono font-bold ${
            diff >= 0 ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {diff >= 0 ? `+${diff} pts` : `${diff} pts`}
        </span>
      </div>
    </div>
  );
}

export default function AnalyticsRechartsPair({
  weeklyProgress,
  radarAxes,
  chartAnimKey = 0,
}: AnalyticsRechartsPairProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [activeBarIdx, setActiveBarIdx] = useState<number | null>(null);
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [showUserRadar, setShowUserRadar] = useState<boolean>(true);
  const [showBenchmarkRadar, setShowBenchmarkRadar] = useState<boolean>(true);
  const [selectedPillarIdx, setSelectedPillarIdx] = useState<number | null>(null);

  const targetThreshold = 75;

  // Build unique labels if backend returns duplicate day abbreviations (e.g. multiple "Mar")
  const barData = useMemo(() => {
    const counts = new Map<string, number>();
    weeklyProgress.forEach((item) => {
      counts.set(item.day, (counts.get(item.day) || 0) + 1);
    });
    const seen = new Map<string, number>();

    return weeklyProgress.map((item) => {
      const totalForDay = counts.get(item.day) || 1;
      const nextIdx = (seen.get(item.day) || 0) + 1;
      seen.set(item.day, nextIdx);

      const displayLabel =
        totalForDay > 1 ? `${item.day} ${nextIdx}` : item.day;

      return {
        ...item,
        displayLabel,
        score: Math.max(0, Math.min(100, Math.round(item.score))),
        target: item.target || targetThreshold,
      };
    });
  }, [weeklyProgress]);

  const weeklyAvg = useMemo(() => {
    if (!barData.length) return 0;
    return Math.round(
      barData.reduce((acc, item) => acc + item.score, 0) / barData.length
    );
  }, [barData]);

  const bestDay = useMemo(() => {
    if (!barData.length) return null;
    return barData.reduce(
      (best, cur) => (cur.score > best.score ? cur : best),
      barData[0]
    );
  }, [barData]);

  const daysAboveTarget = useMemo(
    () => barData.filter((d) => d.score >= targetThreshold).length,
    [barData]
  );

  const radarData = useMemo(
    () =>
      radarAxes.map((axis) => ({
        fullLabel: axis.label,
        shortLabel: shortenRadarLabel(axis.label),
        score: Math.max(0, Math.min(100, Math.round(axis.score))),
        benchmark: Math.max(0, Math.min(100, Math.round(axis.benchmark || 80))),
      })),
    [radarAxes]
  );

  const selectedPillar =
    selectedPillarIdx !== null && radarData[selectedPillarIdx]
      ? radarData[selectedPillarIdx]
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Gráfica 1: Puntaje Obtenido por Día (Recharts BarChart) ── */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Puntaje Obtenido por Día
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Calificaciones obtenidas esta semana (escala 0 a 100). Pasa o haz clic sobre una barra.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTargetLine((v) => !v)}
              aria-pressed={showTargetLine}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
                showTargetLine
                  ? "bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-indigo-400/50"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
              title="Mostrar u ocultar línea de meta (75 pts)"
            >
              {showTargetLine ? (
                <Eye className="w-3 h-3 text-emerald-400" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
              <span>Meta 75</span>
            </button>
            <div className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
              Promedio: {weeklyAvg} pts
            </div>
          </div>
        </div>

        <div className="w-full h-[250px] pt-4 pb-1" key={`recharts-bar-${chartAnimKey}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 22, right: 12, left: -18, bottom: 4 }}
              onMouseLeave={() => setActiveBarIdx(null)}
            >
              <defs>
                <linearGradient id="dcBarIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <linearGradient id="dcBarIndigoActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="dcBarEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.06)"
              />

              <XAxis
                dataKey="displayLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#a1a1aa", fontSize: 11, fontWeight: 600 }}
                dy={6}
              />

              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
              />

              <Tooltip
                content={<WeeklyBarTooltip />}
                cursor={{ fill: "rgba(99, 102, 241, 0.08)", radius: 10 }}
              />

              {showTargetLine && (
                <ReferenceLine
                  y={targetThreshold}
                  stroke="#34d399"
                  strokeOpacity={0.55}
                  strokeDasharray="4 4"
                  label={{
                    value: "Meta 75 pts",
                    position: "insideTopRight",
                    fill: "#6ee7b7",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                />
              )}

              <Bar
                dataKey="score"
                radius={[10, 10, 4, 4]}
                maxBarSize={40}
                background={{ fill: "rgba(39, 39, 42, 0.55)", radius: 10 }}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={850}
                animationEasing="ease-out"
                onMouseEnter={(_data, idx) => setActiveBarIdx(idx)}
                onClick={(_data, idx) =>
                  setActiveBarIdx((prev) => (prev === idx ? null : idx))
                }
              >
                {barData.map((entry, idx) => {
                  const passed = entry.score >= targetThreshold;
                  const isActive = activeBarIdx === idx;
                  const isDimmed = activeBarIdx !== null && !isActive;

                  return (
                    <Cell
                      key={`bar-${idx}`}
                      cursor="pointer"
                      fill={
                        passed
                          ? "url(#dcBarEmerald)"
                          : isActive
                          ? "url(#dcBarIndigoActive)"
                          : "url(#dcBarIndigo)"
                      }
                      fillOpacity={isDimmed ? 0.45 : 1}
                    />
                  );
                })}
                <LabelList
                  dataKey="score"
                  position="top"
                  offset={8}
                  style={{
                    fill: "#f4f4f5",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-zinc-400">Mejor resultado:</span>
            <span className="font-bold font-mono text-emerald-400 truncate">
              {bestDay ? `${bestDay.displayLabel} (${bestDay.score} pts)` : "N/A"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-zinc-400">Días sobre la meta:</span>
            <span className="font-bold font-mono text-white whitespace-nowrap">
              {daysAboveTarget} de {barData.length} días
            </span>
          </div>
        </div>
      </div>

      {/* ── Gráfica 2: Radar de Habilidades Técnicas (Recharts RadarChart) ── */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Radar de Habilidades Técnicas
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tus 5 pilares frente al estándar (80 pts). Haz clic en la leyenda para alternar capas.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setShowUserRadar((v) => !v)}
              aria-pressed={showUserRadar}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                showUserRadar
                  ? "bg-indigo-500/15 border-indigo-400/40 text-indigo-200 font-semibold"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>Tú</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBenchmarkRadar((v) => !v)}
              aria-pressed={showBenchmarkRadar}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                showBenchmarkRadar
                  ? "bg-zinc-800/80 border-zinc-600 text-zinc-200 font-semibold"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-dashed border-emerald-400 bg-emerald-400/20" />
              <span>Meta</span>
            </button>
          </div>
        </div>

        <div className="w-full h-[250px] py-1" key={`recharts-radar-${chartAnimKey}`}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
              <defs>
                <linearGradient id="dcRadarUserFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.58} />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity={0.28} />
                </linearGradient>
              </defs>

              <PolarGrid stroke="rgba(255,255,255,0.1)" />

              <PolarAngleAxis
                dataKey="shortLabel"
                tick={{ fill: "#d4d4d8", fontSize: 10, fontWeight: 600 }}
              />

              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tickCount={5}
                tick={{ fill: "#71717a", fontSize: 9, fontFamily: "monospace" }}
                axisLine={false}
              />

              <Tooltip content={<SkillRadarTooltip />} />

              {showBenchmarkRadar && (
                <Radar
                  name="Meta"
                  dataKey="benchmark"
                  stroke="#34d399"
                  strokeOpacity={0.65}
                  strokeWidth={1.6}
                  strokeDasharray="4 4"
                  fill="#34d399"
                  fillOpacity={0.05}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={750}
                  animationEasing="ease-out"
                />
              )}

              {showUserRadar && (
                <Radar
                  name="Tú"
                  dataKey="score"
                  stroke="#a5b4fc"
                  strokeWidth={2.5}
                  fill="url(#dcRadarUserFill)"
                  fillOpacity={1}
                  dot={{ r: 4, fill: "#cac5fe", stroke: "#11131c", strokeWidth: 2 }}
                  activeDot={{ r: 6.5, fill: "#f0abfc", stroke: "#11131c", strokeWidth: 2 }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 5 tarjetas interactivas de pilares sincronizadas */}
        <div className="flex flex-col gap-2 pt-3 border-t border-zinc-800">
          <div className="grid grid-cols-5 gap-2 text-center">
            {radarData.map((axis, i) => {
              const isSelected = selectedPillarIdx === i;
              return (
                <button
                  key={axis.fullLabel}
                  type="button"
                  onClick={() =>
                    setSelectedPillarIdx((prev) => (prev === i ? null : i))
                  }
                  onMouseEnter={() => setSelectedPillarIdx(i)}
                  onMouseLeave={() => setSelectedPillarIdx(null)}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-500/20 border-indigo-400/50 -translate-y-0.5"
                      : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <p className="text-[9px] text-zinc-400 truncate" title={axis.fullLabel}>
                    {axis.fullLabel}
                  </p>
                  <p className="text-xs font-bold font-mono text-white mt-0.5">
                    {axis.score}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedPillar && (
            <div className="px-3 py-1.5 rounded-xl bg-zinc-950/75 border border-indigo-500/25 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-white truncate">
                {selectedPillar.fullLabel}
              </span>
              <span className="font-mono font-bold text-indigo-300 shrink-0 ml-2">
                {selectedPillar.score}/100 · Meta {selectedPillar.benchmark}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
