"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  Award,
  Calendar,
  Flame,
  ArrowUpDown,
  BarChart3,
  ListChecks,
  ChevronDown,
  ArrowRight,
  Grid3X3,
  Pin,
} from "lucide-react";

export interface MasteryAreaItem {
  name: string;
  score: number;
  benchmark: number;
  status: string;
  badgeColor: string;
  barColor: string;
}

interface AnalyticsMasteryAndHeatmapProps {
  areas: MasteryAreaItem[];
  activeStreakDays: number;
  practiceHoursMonth: number;
  chartAnimKey?: number;
}

const CHART_EASE = [0.22, 1, 0.36, 1] as const;

const AREA_ENRICHMENT: Record<
  string,
  { short: string; skills: string[]; href: string; cta: string; hex: string }
> = {
  "Patrones GoF & Arquitectura Limpia": {
    short: "GoF & Clean",
    skills: ["Factory", "Strategy", "Bridge", "Observer", "SOLID"],
    href: "/code-challenge",
    cta: "Practicar patrones",
    hex: "#10b981",
  },
  "Estructuras de Datos & Complejidad Big-O": {
    short: "Estructuras",
    skills: ["Árboles", "Grafos", "Hash Maps", "Heaps", "Big-O"],
    href: "/code-challenge",
    cta: "Practicar algoritmos",
    hex: "#6366f1",
  },
  "Diseño de APIs RESTful & Microservicios": {
    short: "APIs & Micro.",
    skills: ["REST", "Rate Limiting", "Caché", "Idempotencia", "Queues"],
    href: "/interview",
    cta: "Simular arquitectura",
    hex: "#06b6d4",
  },
  "Bases de Datos & Control de Concurrencia": {
    short: "Bases Datos",
    skills: ["Índices B-Tree", "ACID", "Locks", "Sharding", "DynamoDB"],
    href: "/interview",
    cta: "Practicar SQL/NoSQL",
    hex: "#f59e0b",
  },
  "Comunicación Técnica & Metodología STAR": {
    short: "STAR & Voz",
    skills: ["STAR", "Trade-offs", "Claridad", "Síntesis", "Liderazgo"],
    href: "/interview",
    cta: "Entrevista de voz",
    hex: "#a855f7",
  },
};

const HEATMAP_DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"] as const;
const HEATMAP_DAYS_FULL = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

const HEATMAP_PATTERN: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 0, 1, 0, 0],
  [1, 0, 1, 2, 0, 1, 0],
  [0, 2, 1, 0, 3, 2, 0],
  [1, 1, 0, 2, 1, 0, 0],
  [2, 0, 3, 1, 0, 1, 1],
  [1, 2, 1, 0, 2, 0, 0],
  [0, 1, 2, 3, 1, 2, 0],
  [2, 1, 0, 2, 3, 1, 0],
  [1, 2, 2, 1, 2, 3, 0],
  [2, 3, 1, 2, 0, 2, 1],
  [3, 2, 3, 2, 3, 1, 2],
  [3, 3, 2, 3, 3, 2, 3],
];

const LEVEL_META: Record<
  number,
  { label: string; cellClass: string; badgeClass: string; summary: string }
> = {
  0: {
    label: "Sin práctica",
    cellClass: "bg-zinc-800/60 border border-zinc-800/80",
    badgeClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
    summary: "Día de descanso — sin sesiones registradas",
  },
  1: {
    label: "Ligero",
    cellClass: "bg-emerald-900/80 border border-emerald-700/50",
    badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60",
    summary: "1 ejercicio rápido o repaso teórico",
  },
  2: {
    label: "Constante",
    cellClass: "bg-emerald-600/90 border border-emerald-400/40",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
    summary: "2 actividades: reto de código + revisión",
  },
  3: {
    label: "Intenso",
    cellClass: "bg-emerald-400 border border-emerald-200/60 shadow-sm shadow-emerald-400/40",
    badgeClass: "bg-emerald-400/20 text-emerald-200 border-emerald-400/45",
    summary: "3+ actividades: entrevista IA + retos GoF",
  },
};

interface MasteryTooltipPayload {
  payload?: {
    name: string;
    score: number;
    benchmark: number;
    delta: number;
  };
}

function MasteryCompareTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: MasteryTooltipPayload[];
}) {
  if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  return (
    <div className="px-3.5 py-2.5 rounded-xl bg-[#0b0d17]/95 border border-indigo-500/35 shadow-2xl backdrop-blur-md text-xs max-w-[240px]">
      <p className="font-bold text-white mb-1.5 leading-snug">{item.name}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-zinc-400">Tu dominio:</span>
        <span className="font-mono font-extrabold text-indigo-300">{item.score}%</span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-zinc-400">Meta contratación:</span>
        <span className="font-mono font-semibold text-zinc-300">{item.benchmark}%</span>
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-zinc-400">Margen:</span>
        <span
          className={`font-mono font-bold ${
            item.delta >= 0 ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {item.delta >= 0 ? `+${item.delta}%` : `${item.delta}%`}
        </span>
      </div>
    </div>
  );
}

interface WeeklyVolumePayload {
  payload?: {
    weekLabel: string;
    total: number;
    activeDays: number;
  };
}

function WeeklyVolumeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: WeeklyVolumePayload[];
}) {
  if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-xl bg-[#0b0d17]/95 border border-emerald-500/35 shadow-2xl backdrop-blur-md text-xs">
      <p className="font-bold text-white mb-1">{item.weekLabel}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-zinc-400">Actividades:</span>
        <span className="font-mono font-extrabold text-emerald-400">{item.total}</span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-zinc-400">Días activos:</span>
        <span className="font-mono font-semibold text-zinc-200">{item.activeDays} / 7</span>
      </div>
    </div>
  );
}

export default function AnalyticsMasteryAndHeatmap({
  areas,
  activeStreakDays,
  practiceHoursMonth,
  chartAnimKey = 0,
}: AnalyticsMasteryAndHeatmapProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  // ── State: Matriz de Dominio Técnico ──
  const [masteryView, setMasteryView] = useState<"bars" | "compare">("bars");
  const [sortMode, setSortMode] = useState<"default" | "score" | "gap">("default");
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  // ── State: Mapa de Calor (12 Semanas) ──
  const [heatView, setHeatView] = useState<"grid" | "weekly">("grid");
  const [intensityFilter, setIntensityFilter] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ wIdx: number; dIdx: number; level: number } | null>(null);
  const [pinnedCell, setPinnedCell] = useState<{ wIdx: number; dIdx: number; level: number } | null>(null);

  const sortedAreas = useMemo(() => {
    const enriched = areas.map((area) => {
      const meta = AREA_ENRICHMENT[area.name] ?? {
        short: area.name.slice(0, 12),
        skills: ["Fundamentos", "Práctica aplicada", "Buenas prácticas"],
        href: "/code-challenge",
        cta: "Practicar",
        hex: "#818cf8",
      };
      return {
        ...area,
        ...meta,
        delta: area.score - area.benchmark,
      };
    });

    if (sortMode === "score") {
      return [...enriched].sort((a, b) => b.score - a.score);
    }
    if (sortMode === "gap") {
      return [...enriched].sort((a, b) => b.delta - a.delta);
    }
    return enriched;
  }, [areas, sortMode]);

  const passedCount = useMemo(
    () => areas.filter((a) => a.score >= a.benchmark).length,
    [areas]
  );

  // Weekly aggregation for the Heatmap's secondary interactive Recharts Bar view
  const weeklyVolumeData = useMemo(
    () =>
      HEATMAP_PATTERN.map((week, idx) => ({
        shortLabel: `S${idx + 1}`,
        weekLabel: `Semana ${idx + 1}`,
        total: week.reduce((acc, v) => acc + v, 0),
        activeDays: week.filter((v) => v > 0).length,
      })),
    []
  );

  const totalActivities = useMemo(
    () => weeklyVolumeData.reduce((acc, w) => acc + w.total, 0),
    [weeklyVolumeData]
  );

  const activeCell = hoveredCell ?? pinnedCell;

  const matchingFilterCount = useMemo(() => {
    if (intensityFilter === null) return 0;
    let count = 0;
    HEATMAP_PATTERN.forEach((week) =>
      week.forEach((lvl) => {
        if (lvl === intensityFilter) count++;
      })
    );
    return count;
  }, [intensityFilter]);

  const cycleSortMode = () => {
    setSortMode((prev) =>
      prev === "default" ? "score" : prev === "score" ? "gap" : "default"
    );
  };

  const sortLabel =
    sortMode === "default"
      ? "Orden: Base"
      : sortMode === "score"
      ? "Orden: Mayor %"
      : "Orden: Margen";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ═════════ GRÁFICA 5: MATRIZ DE DOMINIO TÉCNICO INTERACTIVA ═════════ */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Matriz de Dominio Técnico
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Haz clic en cualquier área para ver sub-habilidades y brecha frente a la meta.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {masteryView === "bars" && (
              <button
                type="button"
                onClick={cycleSortMode}
                className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                title="Cambiar orden de las áreas"
              >
                <ArrowUpDown className="w-3 h-3 text-amber-400" />
                <span>{sortLabel}</span>
              </button>
            )}

            <div className="flex items-center p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-semibold">
              {(
                [
                  { id: "bars", label: "Detalle", icon: <ListChecks className="w-3 h-3" /> },
                  { id: "compare", label: "Gráfico", icon: <BarChart3 className="w-3 h-3" /> },
                ] as const
              ).map((tab) => {
                const active = masteryView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMasteryView(tab.id)}
                    aria-pressed={active}
                    className={`relative px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="masteryViewModePill"
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
          </div>
        </div>

        <div className="py-3 min-h-[268px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {masteryView === "bars" ? (
              <motion.div
                key={`mastery-bars-${chartAnimKey}`}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2.5"
                onMouseLeave={() => setHoveredArea(null)}
              >
                {sortedAreas.map((area, idx) => {
                  const isExpanded = expandedArea === area.name;
                  const isHovered = hoveredArea === area.name;
                  const isDimmed = hoveredArea !== null && !isHovered && !isExpanded;

                  return (
                    <motion.div
                      key={area.name}
                      layout
                      transition={{ duration: 0.25, ease: CHART_EASE }}
                      onMouseEnter={() => setHoveredArea(area.name)}
                      className={`rounded-2xl border transition-colors ${
                        isExpanded
                          ? "bg-zinc-900/90 border-indigo-500/40 p-3"
                          : isHovered
                          ? "bg-zinc-900/60 border-zinc-700/80 p-2.5"
                          : "bg-transparent border-transparent p-2.5"
                      }`}
                      style={{ opacity: isDimmed ? 0.55 : 1 }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedArea((prev) => (prev === area.name ? null : area.name))
                        }
                        aria-expanded={isExpanded}
                        className="w-full text-left space-y-1.5 cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-semibold text-zinc-100 flex items-center gap-1.5 min-w-0">
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-indigo-400" : ""
                              }`}
                            />
                            <span className="truncate">{area.name}</span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${area.badgeColor}`}
                            >
                              {area.status}
                            </span>
                            <span className="font-mono font-bold text-white w-9 text-right">
                              {area.score}%
                            </span>
                          </div>
                        </div>

                        {/* Interactive progress bar with benchmark pin */}
                        <div className="w-full bg-zinc-800/90 rounded-full h-2.5 relative overflow-visible">
                          <div className="w-full h-full rounded-full overflow-hidden">
                            <motion.div
                              initial={prefersReducedMotion ? false : { scaleX: 0 }}
                              whileInView={{ scaleX: 1 }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 0.8,
                                delay: 0.06 + idx * 0.07,
                                ease: CHART_EASE,
                              }}
                              style={{ width: `${area.score}%`, transformOrigin: "left" }}
                              className={`h-full rounded-full bg-gradient-to-r ${area.barColor}`}
                            />
                          </div>

                          {/* Benchmark threshold marker */}
                          <div
                            style={{ left: `${area.benchmark}%` }}
                            className={`absolute -top-0.5 -bottom-0.5 w-0.5 rounded-full transition-all pointer-events-none ${
                              isHovered || isExpanded
                                ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)]"
                                : "bg-white/45"
                            }`}
                          />
                        </div>
                      </button>

                      {/* Expandable skill breakdown drawer */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: CHART_EASE }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 mt-2.5 border-t border-zinc-800/90 flex flex-col gap-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <span className="text-zinc-400">
                                  Meta requerida:{" "}
                                  <strong className="font-mono text-zinc-200">
                                    {area.benchmark}%
                                  </strong>{" "}
                                  ·{" "}
                                  <strong
                                    className={`font-mono ${
                                      area.delta >= 0 ? "text-emerald-400" : "text-amber-400"
                                    }`}
                                  >
                                    {area.delta >= 0
                                      ? `+${area.delta}% sobre meta`
                                      : `${area.delta}% bajo meta`}
                                  </strong>
                                </span>
                                <Link
                                  href={area.href}
                                  className="text-indigo-300 hover:text-indigo-200 font-semibold flex items-center gap-1"
                                >
                                  <span>{area.cta}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {area.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-0.5 rounded-md bg-zinc-950/90 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key={`mastery-compare-${chartAnimKey}`}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-[256px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedAreas}
                    layout="vertical"
                    margin={{ top: 6, right: 18, left: 6, bottom: 4 }}
                    barGap={3}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="short"
                      width={86}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#d4d4d8", fontSize: 10, fontWeight: 600 }}
                    />
                    <Tooltip
                      content={<MasteryCompareTooltip />}
                      cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                    />
                    <Bar
                      dataKey="benchmark"
                      name="Meta"
                      fill="#3f3f46"
                      radius={[0, 6, 6, 0]}
                      barSize={9}
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={700}
                    />
                    <Bar
                      dataKey="score"
                      name="Tu dominio"
                      radius={[0, 6, 6, 0]}
                      barSize={11}
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={850}
                    >
                      {sortedAreas.map((entry) => (
                        <Cell key={entry.name} fill={entry.hex} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-3 border-t border-zinc-800 text-xs flex items-center justify-between text-zinc-400">
          <span>Línea vertical = Umbral de contratación</span>
          <span className="text-emerald-400 font-semibold font-mono">
            {passedCount}/{areas.length} Superadas (
            {Math.round((passedCount / Math.max(1, areas.length)) * 100)}%)
          </span>
        </div>
      </div>

      {/* ═════════ GRÁFICA 6: MAPA DE CALOR DE PRÁCTICA (12 SEMANAS) INTERACTIVO ═════════ */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Mapa de Calor de Práctica (12 Semanas)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Filtra por intensidad en la leyenda o haz clic en un día para inspeccionarlo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-semibold">
              {(
                [
                  { id: "grid", label: "Calor", icon: <Grid3X3 className="w-3 h-3" /> },
                  { id: "weekly", label: "Semanas", icon: <BarChart3 className="w-3 h-3" /> },
                ] as const
              ).map((tab) => {
                const active = heatView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHeatView(tab.id)}
                    aria-pressed={active}
                    className={`relative px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="heatmapViewModePill"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-emerald-500/20 border border-emerald-400/35"
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

            <div className="flex items-center gap-1 text-xs text-amber-400 font-mono font-bold whitespace-nowrap">
              <Flame className="w-4 h-4 fill-amber-400/20" />
              <span>{activeStreakDays}d</span>
            </div>
          </div>
        </div>

        <div className="py-3 min-h-[240px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {heatView === "grid" ? (
              <motion.div
                key={`heatmap-grid-${chartAnimKey}`}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
                onMouseLeave={() => setHoveredCell(null)}
              >
                {/* 12x7 Grid con encabezados de semana y resaltado cruzado */}
                <div className="overflow-x-auto pb-1">
                  <div className="flex flex-col items-center gap-1.5 min-w-fit mx-auto">
                    {/* Números de semana S1..S12 */}
                    <div className="flex items-center gap-1.5 pl-4">
                      {HEATMAP_PATTERN.map((_, wIdx) => {
                        const isColActive = activeCell?.wIdx === wIdx;
                        return (
                          <span
                            key={wIdx}
                            className={`w-4 text-center text-[8px] font-mono transition-colors ${
                              isColActive ? "text-emerald-300 font-bold" : "text-zinc-600"
                            }`}
                          >
                            {wIdx % 2 === 0 || wIdx === 11 ? `S${wIdx + 1}` : ""}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-start gap-1.5 justify-center">
                      {/* Etiquetas L..D con resaltado activo */}
                      <div className="flex flex-col gap-1.5 text-[9px] pr-1 select-none font-mono">
                        {HEATMAP_DAYS_SHORT.map((dayChar, dIdx) => (
                          <span
                            key={dayChar}
                            className={`h-4 flex items-center transition-colors ${
                              activeCell?.dIdx === dIdx
                                ? "text-emerald-300 font-bold"
                                : "text-zinc-500"
                            }`}
                          >
                            {dayChar}
                          </span>
                        ))}
                      </div>

                      {HEATMAP_PATTERN.map((week, wIdx) => {
                        const isColActive = activeCell?.wIdx === wIdx;
                        return (
                          <div
                            key={wIdx}
                            className={`flex flex-col gap-1.5 rounded-md p-[1px] transition-colors ${
                              isColActive ? "bg-emerald-500/10" : ""
                            }`}
                          >
                            {week.map((level, dIdx) => {
                              const meta = LEVEL_META[level] ?? LEVEL_META[0];
                              const isPinned =
                                pinnedCell?.wIdx === wIdx && pinnedCell?.dIdx === dIdx;
                              const isFilteredOut =
                                intensityFilter !== null && level !== intensityFilter;

                              return (
                                <motion.button
                                  key={dIdx}
                                  type="button"
                                  initial={prefersReducedMotion ? false : { scale: 0.4, opacity: 0 }}
                                  whileInView={{ scale: 1, opacity: isFilteredOut ? 0.18 : 1 }}
                                  animate={{ opacity: isFilteredOut ? 0.18 : 1 }}
                                  viewport={{ once: true }}
                                  whileHover={prefersReducedMotion ? undefined : { scale: 1.4, zIndex: 10 }}
                                  transition={{
                                    scale: { duration: 0.22, delay: wIdx * 0.022 + dIdx * 0.012 },
                                    opacity: { duration: 0.18 },
                                  }}
                                  onMouseEnter={() => setHoveredCell({ wIdx, dIdx, level })}
                                  onClick={() =>
                                    setPinnedCell((prev) =>
                                      prev?.wIdx === wIdx && prev?.dIdx === dIdx
                                        ? null
                                        : { wIdx, dIdx, level }
                                    )
                                  }
                                  aria-label={`Semana ${wIdx + 1}, ${HEATMAP_DAYS_FULL[dIdx]}: ${
                                    level === 0 ? "Sin práctica" : `${level} actividades`
                                  }`}
                                  className={`w-4 h-4 rounded-[4px] cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-300 ${
                                    meta.cellClass
                                  } ${isPinned ? "ring-2 ring-white ring-offset-1 ring-offset-[#11131c]" : ""}`}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Leyenda interactiva (clic para filtrar por nivel) */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span className="font-mono text-zinc-300">
                    {intensityFilter !== null ? (
                      <>
                        Filtro:{" "}
                        <strong className="text-emerald-300">
                          {LEVEL_META[intensityFilter].label}
                        </strong>{" "}
                        ({matchingFilterCount} días)
                      </>
                    ) : (
                      `Total: ${totalActivities} actividades en 12 semanas`
                    )}
                  </span>

                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-zinc-500">Menos</span>
                    {[0, 1, 2, 3].map((lvl) => {
                      const selected = intensityFilter === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() =>
                            setIntensityFilter((prev) => (prev === lvl ? null : lvl))
                          }
                          aria-pressed={selected}
                          title={`Filtrar: ${LEVEL_META[lvl].label}`}
                          className={`w-3.5 h-3.5 rounded-[3px] cursor-pointer transition-transform hover:scale-125 ${
                            LEVEL_META[lvl].cellClass
                          } ${selected ? "ring-2 ring-white scale-110" : ""}`}
                        />
                      );
                    })}
                    <span className="text-zinc-300">Más</span>
                  </div>
                </div>

                {/* Inspector en vivo del día seleccionado / enfocado */}
                <div className="p-3 rounded-2xl bg-zinc-950/75 border border-zinc-800/90 min-h-[58px] flex items-center justify-between gap-3">
                  <AnimatePresence mode="wait">
                    {activeCell ? (
                      <motion.div
                        key={`cell-${activeCell.wIdx}-${activeCell.dIdx}`}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="w-full flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">
                              Semana {activeCell.wIdx + 1} · {HEATMAP_DAYS_FULL[activeCell.dIdx]}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                LEVEL_META[activeCell.level].badgeClass
                              }`}
                            >
                              {LEVEL_META[activeCell.level].label}
                            </span>
                            {pinnedCell?.wIdx === activeCell.wIdx &&
                              pinnedCell?.dIdx === activeCell.dIdx && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-300 font-semibold">
                                  <Pin className="w-2.5 h-2.5" /> Fijado
                                </span>
                              )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {LEVEL_META[activeCell.level].summary} ·{" "}
                            <span className="font-mono text-zinc-300">
                              {weeklyVolumeData[activeCell.wIdx]?.total ?? 0} act. esa semana
                            </span>
                          </p>
                        </div>
                        <span className="font-mono text-lg font-black text-emerald-400 shrink-0">
                          {activeCell.level}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="cell-hint"
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                        className="text-[11px] text-zinc-500"
                      >
                        Pasa sobre cualquier cuadro o haz clic para fijar el detalle diario. También puedes filtrar niveles en la leyenda.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`heatmap-weekly-${chartAnimKey}`}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-[230px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyVolumeData}
                    margin={{ top: 10, right: 8, left: -22, bottom: 2 }}
                  >
                    <defs>
                      <linearGradient id="dcHeatBar" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="shortLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <Tooltip
                      content={<WeeklyVolumeTooltip />}
                      cursor={{ fill: "rgba(16, 185, 129, 0.08)", radius: 8 }}
                    />
                    <Bar
                      dataKey="total"
                      fill="url(#dcHeatBar)"
                      radius={[6, 6, 2, 2]}
                      maxBarSize={24}
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">Horas este mes:</span>
            <span className="font-bold font-mono text-white">{practiceHoursMonth} hrs</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">Constancia semanal:</span>
            <span className="font-bold font-mono text-emerald-400">85% activa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
