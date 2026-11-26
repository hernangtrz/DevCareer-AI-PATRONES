"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  type PieSectorShapeProps,
} from "recharts";
import { PieChart as PieChartIcon, ArrowRight, BarChart2, Pin } from "lucide-react";

interface ChallengesDonutChartProps {
  challengesCompleted: number;
  challengeSuccessRate: number;
  chartAnimKey?: number;
}

interface DifficultySlice {
  id: "easy" | "medium" | "hard";
  name: string;
  shortName: string;
  subtitle: string;
  topics: string;
  count: number;
  catalogTotal: number;
  percent: number;
  passRate: number;
  color: string;
  glow: string;
  gradientId: string;
  textClass: string;
  badgeClass: string;
  activeRowClass: string;
  barGradient: string;
  dotClass: string;
}

interface CustomTooltipPayload {
  payload?: DifficultySlice;
}

const CHART_EASE = [0.22, 1, 0.36, 1] as const;

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayload[];
}) {
  if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;

  return (
    <div className="px-3.5 py-2.5 rounded-xl bg-[#0b0d17]/95 border border-indigo-500/35 shadow-2xl shadow-black/60 backdrop-blur-md text-xs min-w-[180px]">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: item.color }}
          />
          {item.name}
        </span>
        <span className={`font-mono font-extrabold ${item.textClass}`}>
          {item.percent}%
        </span>
      </div>
      <div className="flex items-center justify-between text-zinc-400">
        <span>Resueltos:</span>
        <span className="font-mono font-bold text-zinc-100">
          {item.count} / {item.catalogTotal}
        </span>
      </div>
      <div className="flex items-center justify-between text-zinc-400 mt-0.5">
        <span>Tasa de éxito:</span>
        <span className="font-mono font-bold text-emerald-400">{item.passRate}%</span>
      </div>
    </div>
  );
}

export default function ChallengesDonutChart({
  challengesCompleted,
  challengeSuccessRate,
  chartAnimKey = 0,
}: ChallengesDonutChartProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pinnedIdx, setPinnedIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"donut" | "bars">("donut");

  const safeTotal = Math.max(1, challengesCompleted || 24);
  const safeRate = Math.max(0, Math.min(100, Math.round(challengeSuccessRate || 78)));

  const slices: DifficultySlice[] = useMemo(() => {
    const easyCount = Math.max(1, Math.round(safeTotal * 0.375));
    const hardCount = Math.max(1, Math.round(safeTotal * 0.208));
    const medCount = Math.max(1, safeTotal - easyCount - hardCount);
    const total = easyCount + medCount + hardCount;

    const easyPct = Math.round((easyCount / total) * 100);
    const hardPct = Math.round((hardCount / total) * 100);
    const medPct = Math.max(0, 100 - easyPct - hardPct);

    return [
      {
        id: "easy",
        name: "Fácil",
        shortName: "Fácil",
        subtitle: "Algoritmos básicos",
        topics: "Two Pointers, Hash Maps, Strings y Recursión",
        count: easyCount,
        catalogTotal: Math.max(easyCount + 1, 10),
        percent: easyPct,
        passRate: Math.min(98, safeRate + 14),
        color: "#10b981",
        glow: "rgba(16, 185, 129, 0.45)",
        gradientId: "dcDonutEasy",
        textClass: "text-emerald-400",
        badgeClass: "bg-emerald-500/15 border-emerald-500/35 text-emerald-300",
        activeRowClass: "bg-emerald-500/15 border-emerald-500/45 shadow-lg shadow-emerald-950/40",
        barGradient: "from-emerald-500 to-teal-400",
        dotClass: "bg-emerald-500",
      },
      {
        id: "medium",
        name: "Medio",
        shortName: "Medio",
        subtitle: "Estructuras & Big-O",
        topics: "Árboles, Grafos, Sliding Window y Programación Dinámica",
        count: medCount,
        catalogTotal: Math.max(medCount + 2, 14),
        percent: medPct,
        passRate: safeRate,
        color: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.45)",
        gradientId: "dcDonutMed",
        textClass: "text-amber-400",
        badgeClass: "bg-amber-500/15 border-amber-500/35 text-amber-300",
        activeRowClass: "bg-amber-500/15 border-amber-500/45 shadow-lg shadow-amber-950/40",
        barGradient: "from-amber-500 to-yellow-400",
        dotClass: "bg-amber-500",
      },
      {
        id: "hard",
        name: "Difícil / GoF",
        shortName: "Difícil",
        subtitle: "Visitor, LRU, Sorter",
        topics: "Patrones GoF (Visitor, Strategy, Observer), LRU Cache y Concurrencia",
        count: hardCount,
        catalogTotal: Math.max(hardCount + 3, 8),
        percent: hardPct,
        passRate: Math.max(45, safeRate - 12),
        color: "#a855f7",
        glow: "rgba(168, 85, 247, 0.48)",
        gradientId: "dcDonutHard",
        textClass: "text-purple-400",
        badgeClass: "bg-purple-500/15 border-purple-500/35 text-purple-300",
        activeRowClass: "bg-purple-500/15 border-purple-500/45 shadow-lg shadow-purple-950/40",
        barGradient: "from-violet-500 to-fuchsia-400",
        dotClass: "bg-purple-500",
      },
    ];
  }, [safeRate, safeTotal]);

  const effectiveIdx = hoveredIdx !== null ? hoveredIdx : pinnedIdx;
  const activeSlice = effectiveIdx !== null ? slices[effectiveIdx] : null;

  const togglePin = (idx: number) => {
    setPinnedIdx((prev) => (prev === idx ? null : idx));
  };

  const renderInteractiveSector = (props: PieSectorShapeProps) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      index,
    } = props;
    const isActive = effectiveIdx === index;
    const isDimmed = effectiveIdx !== null && !isActive;
    const slice = slices[index];

    return (
      <g className="cursor-pointer">
        {isActive && (
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={outerRadius + 9}
            outerRadius={outerRadius + 12}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={slice?.color ?? fill}
            fillOpacity={0.7}
            cornerRadius={4}
          />
        )}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={isActive ? Math.max(0, innerRadius - 2) : innerRadius}
          outerRadius={isActive ? outerRadius + 6 : outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          fillOpacity={isDimmed ? 0.35 : 1}
          cornerRadius={8}
        />
      </g>
    );
  };

  return (
    <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
      {/* Encabezado + Selector de Vista */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-cyan-400" />
            Distribución de Retos por Dificultad
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Haz clic o pasa el cursor por cada nivel para explorar los {challengesCompleted} retos resueltos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-semibold">
            {(
              [
                { id: "donut", label: "Donut", icon: <PieChartIcon className="w-3 h-3" /> },
                { id: "bars", label: "Progreso", icon: <BarChart2 className="w-3 h-3" /> },
              ] as const
            ).map((tab) => {
              const selected = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  aria-pressed={selected}
                  className={`relative px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                    selected ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="challengesViewModePill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-indigo-500/25 border border-indigo-400/35"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            href="/code-challenge"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 whitespace-nowrap"
          >
            <span>Ver catálogo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cuerpo interactivo: Vista Donut o Vista Progreso */}
      <div className="py-3 min-h-[224px] flex items-center">
        <AnimatePresence mode="wait">
          {viewMode === "donut" ? (
            <motion.div
              key={`donut-view-${chartAnimKey}`}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="w-full flex flex-col sm:flex-row items-center justify-around gap-5"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Recharts Interactive Pie/Donut */}
              <div className="relative w-[200px] h-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <defs>
                      <linearGradient id="dcDonutEasy" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="dcDonutMed" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <linearGradient id="dcDonutHard" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>

                    <Tooltip content={<DonutTooltip />} />

                    <Pie
                      data={slices}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={76}
                      paddingAngle={5}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      shape={renderInteractiveSector}
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={900}
                      animationEasing="ease-out"
                      onMouseEnter={(_entry, idx) => setHoveredIdx(idx)}
                      onClick={(_entry, idx) => togglePin(idx)}
                    >
                      {slices.map((slice) => (
                        <Cell
                          key={slice.id}
                          fill={`url(#${slice.gradientId})`}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Centro dinámico del Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <AnimatePresence mode="wait">
                    {activeSlice ? (
                      <motion.div
                        key={`center-${activeSlice.id}`}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 4, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4, scale: 0.92 }}
                        transition={{ duration: 0.16 }}
                        className="flex flex-col items-center text-center"
                      >
                        <span
                          className={`text-2xl font-black font-mono leading-none ${activeSlice.textClass}`}
                        >
                          {activeSlice.count}
                        </span>
                        <span className="text-[10px] text-zinc-200 font-bold mt-0.5">
                          {activeSlice.shortName}
                        </span>
                        <span className={`text-[9px] font-bold font-mono ${activeSlice.textClass}`}>
                          {activeSlice.percent}% · {activeSlice.passRate}% ok
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="center-total"
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 4, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4, scale: 0.92 }}
                        transition={{ duration: 0.16 }}
                        className="flex flex-col items-center text-center"
                      >
                        <span className="text-2xl font-black text-white font-mono leading-none">
                          {challengesCompleted}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          Resueltos
                        </span>
                        <span className="text-[9px] text-emerald-400 font-bold font-mono">
                          {safeRate}% Éxito
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Leyenda interactiva clicable y sincronizada */}
              <div className="flex flex-col gap-2.5 w-full sm:w-auto flex-1 max-w-[260px]">
                {slices.map((slice, idx) => {
                  const isActive = effectiveIdx === idx;
                  const isPinned = pinnedIdx === idx;
                  return (
                    <motion.button
                      key={slice.id}
                      type="button"
                      whileHover={prefersReducedMotion ? undefined : { x: 3 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onClick={() => togglePin(idx)}
                      aria-pressed={isPinned}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                        isActive
                          ? slice.activeRowClass
                          : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-3 h-3 rounded-md shrink-0 ${slice.dotClass}`} />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {slice.name}
                            {isPinned && (
                              <Pin className="w-3 h-3 text-indigo-300 shrink-0" aria-hidden="true" />
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {slice.subtitle}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 ${slice.textClass}`}>
                        {slice.count} ({slice.percent}%)
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="bars-view"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="w-full flex flex-col gap-3.5"
            >
              {slices.map((slice, idx) => {
                const completionPct = Math.min(
                  100,
                  Math.round((slice.count / slice.catalogTotal) * 100)
                );
                return (
                  <div
                    key={slice.id}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${slice.dotClass}`} />
                        <span className="font-bold text-white">{slice.name}</span>
                        <span className="text-[10px] text-zinc-400 truncate hidden sm:inline">
                          · {slice.topics}
                        </span>
                      </div>
                      <span className={`font-mono font-bold shrink-0 ${slice.textClass}`}>
                        {slice.count}/{slice.catalogTotal} ({completionPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
                      <motion.div
                        initial={prefersReducedMotion ? false : { scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                          duration: 0.7,
                          delay: idx * 0.08,
                          ease: CHART_EASE,
                        }}
                        style={{ width: `${completionPct}%`, transformOrigin: "left" }}
                        className={`h-full rounded-full bg-gradient-to-r ${slice.barGradient}`}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pie dinámico con detalle del nivel activo o resumen del catálogo */}
      <div className="pt-3 border-t border-zinc-800 text-xs flex items-center justify-between gap-3 min-h-[34px]">
        <AnimatePresence mode="wait">
          {activeSlice ? (
            <motion.div
              key={`footer-${activeSlice.id}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="w-full flex items-center justify-between gap-2"
            >
              <span className="text-zinc-300 truncate" title={activeSlice.topics}>
                <strong className={activeSlice.textClass}>{activeSlice.name}:</strong>{" "}
                {activeSlice.topics}
              </span>
              <Link
                href="/code-challenge"
                className={`font-semibold whitespace-nowrap shrink-0 hover:underline ${activeSlice.textClass}`}
              >
                Practicar →
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="footer-default"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="w-full flex items-center justify-between gap-2 text-zinc-400"
            >
              <span>Catálogo expandido con retos de patrones GoF</span>
              <span className="text-white font-mono font-semibold whitespace-nowrap">
                20 disponibles
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
