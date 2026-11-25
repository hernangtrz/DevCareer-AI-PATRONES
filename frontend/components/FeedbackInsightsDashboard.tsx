"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Target,
  BarChart3,
  Radar as RadarIcon,
  Layers,
  MessageSquareQuote,
  MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryScore {
  name: string;
  score: number;
  comment: string;
}

interface FeedbackInsightsDashboardProps {
  role: string;
  company?: string;
  level?: string;
  interviewType?: string;
  techstack?: string[];
  formattedDate: string;
  totalScore: number;
  finalAssessment: string;
  categoryScores: CategoryScore[];
  strengths: string[];
  areasForImprovement: string[];
  lang: "es" | "en";
}

type ThemeFilter = "all" | "positive" | "neutral" | "critical";

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

function classifyScore(score: number): "positive" | "neutral" | "critical" {
  if (score >= 70) return "positive";
  if (score >= 40) return "neutral";
  return "critical";
}

function getReadinessTier(score: number, isEs: boolean) {
  if (score >= 80) {
    return {
      label: isEs ? "Listo para Contratar" : "Hire Ready",
      badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      stroke: "#34d399",
    };
  }
  if (score >= 60) {
    return {
      label: isEs ? "Perfil Competitivo" : "Competitive",
      badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      stroke: "#818cf8",
    };
  }
  if (score >= 35) {
    return {
      label: isEs ? "En Desarrollo" : "Developing",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      stroke: "#fbbf24",
    };
  }
  return {
    label: isEs ? "Refuerzo Prioritario" : "Needs Practice",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    stroke: "#fb7185",
  };
}

function shortenAxisLabel(name: string): string {
  const cleaned = name.trim();
  if (cleaned.length <= 18) return cleaned;
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return words.slice(0, 2).join(" ");
  }
  return `${cleaned.slice(0, 16)}…`;
}

function useAnimatedCount(target: number, disabled: boolean, durationMs = 950): number {
  const [value, setValue] = useState(disabled ? target : 0);

  useEffect(() => {
    if (disabled || target <= 0) {
      const id = window.requestAnimationFrame(() => setValue(target));
      return () => window.cancelAnimationFrame(id);
    }

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [target, disabled, durationMs]);

  return value;
}

export default function FeedbackInsightsDashboard({
  role,
  company,
  level,
  interviewType,
  techstack = [],
  formattedDate,
  totalScore,
  finalAssessment,
  categoryScores,
  strengths,
  areasForImprovement,
  lang,
}: FeedbackInsightsDashboardProps) {
  const isEs = lang === "es";
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number | null>(null);

  const safeScore = Math.max(0, Math.min(100, Math.round(totalScore || 0)));
  const animatedScore = useAnimatedCount(safeScore, prefersReducedMotion, 1050);
  const tier = getReadinessTier(safeScore, isEs);
  const hiringBenchmark = 75;

  const { bestCategory, weakestCategory, sentimentCounts, sentimentPercents } = useMemo(() => {
    if (!categoryScores.length) {
      return {
        bestCategory: null as CategoryScore | null,
        weakestCategory: null as CategoryScore | null,
        sentimentCounts: { positive: 0, neutral: 0, critical: 0 },
        sentimentPercents: { positive: 0, neutral: 0, critical: 0 },
      };
    }

    let best = categoryScores[0];
    let weakest = categoryScores[0];
    const counts = { positive: 0, neutral: 0, critical: 0 };

    for (const cat of categoryScores) {
      if (cat.score > best.score) best = cat;
      if (cat.score < weakest.score) weakest = cat;
      counts[classifyScore(cat.score)] += 1;
    }

    const total = categoryScores.length;
    return {
      bestCategory: best,
      weakestCategory: weakest,
      sentimentCounts: counts,
      sentimentPercents: {
        positive: Math.round((counts.positive / total) * 100),
        neutral: Math.round((counts.neutral / total) * 100),
        critical: Math.round((counts.critical / total) * 100),
      },
    };
  }, [categoryScores]);

  const filteredCategories = useMemo(() => {
    return categoryScores
      .map((cat, idx) => ({ ...cat, originalIndex: idx, sentiment: classifyScore(cat.score) }))
      .filter((cat) => (themeFilter === "all" ? true : cat.sentiment === themeFilter));
  }, [categoryScores, themeFilter]);

  // Circular Score Ring geometry
  const ringSize = 136;
  const ringStroke = 10;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - safeScore / 100);

  // SVG Radar Chart geometry
  const radarAxes = categoryScores.length >= 3 ? categoryScores : [];
  const radarSize = 300;
  const radarCenter = radarSize / 2;
  const radarMaxR = 94;

  const getRadarPoint = (index: number, value: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radarMaxR;
    return {
      x: radarCenter + Math.cos(angle) * r,
      y: radarCenter + Math.sin(angle) * r,
    };
  };

  const radarDataPoints = radarAxes.map((cat, idx) =>
    getRadarPoint(idx, Math.max(cat.score, 4), radarAxes.length)
  );
  const radarPolygon = radarDataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const benchmarkPolygon = radarAxes
    .map((_, idx) => {
      const pt = getRadarPoint(idx, hiringBenchmark, radarAxes.length);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(" ");

  const activeCategory =
    selectedCategoryIdx !== null && categoryScores[selectedCategoryIdx]
      ? categoryScores[selectedCategoryIdx]
      : null;

  const sectionReveal = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.12 },
          transition: { duration: 0.55, delay, ease: SMOOTH_EASE },
        };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* ── 1. Executive Header & Animated Circular Score Gauge ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: SMOOTH_EASE }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1120] via-[#090b14] to-[#06070d] border border-indigo-500/20 p-6 md:p-8 shadow-2xl"
      >
        {/* Subtle breathing ambient glows */}
        <motion.div
          aria-hidden="true"
          animate={
            prefersReducedMotion
              ? undefined
              : { scale: [1, 1.12, 1], opacity: [0.14, 0.22, 0.14] }
          }
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <motion.div
          aria-hidden="true"
          animate={
            prefersReducedMotion
              ? undefined
              : { scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1] }
          }
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-4 max-w-2xl">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: SMOOTH_EASE }}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                {isEs ? "Diagnóstico de Entrevista IA" : "AI Interview Insights"}
              </span>
              {level && (
                <span className="px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-[11px] font-medium">
                  {level}
                </span>
              )}
              {interviewType && (
                <span className="px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-[11px] font-medium">
                  {interviewType}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 text-[11px]">
                <Calendar className="w-3 h-3 text-indigo-400" />
                {formattedDate}
              </span>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14, ease: SMOOTH_EASE }}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {isEs ? "Resultados:" : "Results:"}{" "}
                <span className="capitalize bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300">
                  {role}
                </span>
              </h1>
              {company && (
                <p className="text-xs font-medium text-zinc-400 mt-1">
                  {isEs ? `Contexto de empresa: ${company}` : `Company context: ${company}`}
                </p>
              )}
            </motion.div>

            {techstack.length > 0 && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="flex flex-wrap items-center gap-1.5"
              >
                {techstack.map((tech, i) => (
                  <motion.span
                    key={`${tech}-${i}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.22 + i * 0.04 }}
                    className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-mono text-[11px]"
                  >
                    {tech}
                  </motion.span>
                ))}
              </motion.div>
            )}

            {/* Executive Assessment Verdict */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: SMOOTH_EASE }}
              className="mt-1 p-4 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-md flex items-start gap-3"
            >
              <MessageSquareQuote className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {isEs ? "Veredicto del Evaluador IA" : "AI Evaluator Summary"}
                </span>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  {finalAssessment ||
                    (isEs
                      ? "No se generó un resumen ejecutivo para esta sesión."
                      : "No executive summary was generated for this session.")}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right: Animated Circular Score Ring */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.18, ease: SMOOTH_EASE }}
            className="flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 p-5 rounded-2xl bg-zinc-950/75 border border-white/[0.08] shrink-0 min-w-[210px]"
          >
            <div className="relative flex items-center justify-center">
              <svg
                width={ringSize}
                height={ringSize}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
                role="img"
                aria-label={
                  isEs
                    ? `Puntuación global ${safeScore} de 100`
                    : `Overall score ${safeScore} out of 100`
                }
                className="-rotate-90"
              >
                <defs>
                  <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="55%" stopColor={tier.stroke} />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={ringStroke}
                />
                <motion.circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="url(#scoreRingGrad)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  initial={
                    prefersReducedMotion
                      ? { strokeDashoffset: ringDashOffset }
                      : { strokeDashoffset: ringCircumference }
                  }
                  animate={{ strokeDashoffset: ringDashOffset }}
                  transition={{ duration: 1.15, delay: 0.25, ease: SMOOTH_EASE }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white tabular-nums leading-none">
                  {animatedScore}
                </span>
                <span className="text-[11px] font-semibold text-zinc-400 mt-1">/ 100</span>
              </div>
            </div>

            <div className="flex flex-col items-end lg:items-center gap-1.5 text-right lg:text-center">
              <motion.span
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-bold border",
                  tier.badgeClass
                )}
              >
                {tier.label}
              </motion.span>
              <span className="text-[11px] text-zinc-400">
                {safeScore >= hiringBenchmark
                  ? isEs
                    ? `+${safeScore - hiringBenchmark} pts sobre meta (${hiringBenchmark})`
                    : `+${safeScore - hiringBenchmark} pts above target (${hiringBenchmark})`
                  : isEs
                  ? `A ${hiringBenchmark - safeScore} pts de la meta (${hiringBenchmark})`
                  : `${hiringBenchmark - safeScore} pts to target (${hiringBenchmark})`}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── 2. Core Metrics KPI Strip (Staggered Cascade) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            key: "overall",
            title: isEs ? "Impresión General" : "Overall Score",
            icon: <Award className="w-4 h-4 text-indigo-400" />,
            content: (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white tabular-nums">
                  {animatedScore}
                </span>
                <span className="text-xs text-zinc-500">/100</span>
              </div>
            ),
            sub: isEs
              ? `${categoryScores.length} dimensiones evaluadas`
              : `${categoryScores.length} competencies scored`,
          },
          {
            key: "best",
            title: isEs ? "Mejor Competencia" : "Top Strength",
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
            content: (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-emerald-300 tabular-nums">
                  {bestCategory ? bestCategory.score : 0}
                </span>
                <span className="text-xs text-zinc-500">/100</span>
              </div>
            ),
            sub: bestCategory?.name || (isEs ? "Sin datos" : "No data"),
          },
          {
            key: "weakest",
            title: isEs ? "Foco Prioritario" : "Priority Gap",
            icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
            content: (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-rose-300 tabular-nums">
                  {weakestCategory ? weakestCategory.score : 0}
                </span>
                <span className="text-xs text-zinc-500">/100</span>
              </div>
            ),
            sub: weakestCategory?.name || (isEs ? "Sin datos" : "No data"),
          },
          {
            key: "insights",
            title: isEs ? "Hallazgos Clave" : "Key Insights",
            icon: <Layers className="w-4 h-4 text-violet-400" />,
            content: (
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-emerald-300">
                  +{strengths.length} {isEs ? "fortalezas" : "strengths"}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-sm font-bold text-amber-300">
                  {areasForImprovement.length} {isEs ? "mejoras" : "gaps"}
                </span>
              </div>
            ),
            sub: isEs ? "Plan accionable listo abajo" : "Actionable coaching below",
          },
        ].map((card, idx) => (
          <motion.div
            key={card.key}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
            transition={{ duration: 0.45, delay: 0.14 + idx * 0.06, ease: SMOOTH_EASE }}
            className="p-4 rounded-2xl bg-[#0d101b] border border-zinc-800/80 hover:border-indigo-500/35 transition-colors flex flex-col justify-between gap-2 shadow-lg shadow-black/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {card.title}
              </span>
              {card.icon}
            </div>
            {card.content}
            <p className="text-[11px] text-zinc-300 truncate" title={card.sub}>
              {card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── 3. Interactive Visual Diagrams: Radar + Sentiment & Score Distribution ── */}
      {categoryScores.length > 0 && (
        <motion.div {...sectionReveal(0.06)} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Radar Chart Card */}
          <div className="lg:col-span-5 rounded-3xl bg-[#0c0f1a] border border-zinc-800/80 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <RadarIcon className="w-4 h-4 text-indigo-400" />
                  {isEs ? "Radar de Competencias" : "Competency Radar"}
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isEs
                    ? "Pasa o haz clic en cada vértice para inspeccionar"
                    : "Hover or click vertices to inspect"}
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                Meta: {hiringBenchmark}
              </span>
            </div>

            {radarAxes.length >= 3 ? (
              <div className="flex flex-col items-center justify-center my-1">
                <svg
                  viewBox={`0 0 ${radarSize} ${radarSize}`}
                  className="w-full max-w-[290px] h-auto overflow-visible"
                  role="img"
                  aria-label={
                    isEs
                      ? "Gráfico radar de puntuaciones por competencia"
                      : "Competency score radar chart"
                  }
                >
                  <defs>
                    <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.52" />
                      <stop offset="100%" stopColor="#d946ef" stopOpacity="0.30" />
                    </linearGradient>
                  </defs>

                  {/* Concentric reference rings */}
                  {[25, 50, 75, 100].map((ring) => {
                    const pts = radarAxes
                      .map((_, i) => {
                        const pt = getRadarPoint(i, ring, radarAxes.length);
                        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                      })
                      .join(" ");
                    return (
                      <polygon
                        key={ring}
                        points={pts}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={ring === 100 ? 1.2 : 0.8}
                      />
                    );
                  })}

                  {/* Axis lines */}
                  {radarAxes.map((_, i) => {
                    const outer = getRadarPoint(i, 100, radarAxes.length);
                    return (
                      <line
                        key={i}
                        x1={radarCenter}
                        y1={radarCenter}
                        x2={outer.x}
                        y2={outer.y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Target 75 benchmark polygon */}
                  <motion.polygon
                    points={benchmarkPolygon}
                    fill="none"
                    stroke="rgba(52, 211, 153, 0.45)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />

                  {/* Candidate score polygon blooming outward from center */}
                  <motion.polygon
                    points={radarPolygon}
                    fill="url(#radarFillGrad)"
                    stroke="#a5b4fc"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    style={{ transformOrigin: `${radarCenter}px ${radarCenter}px` }}
                    initial={prefersReducedMotion ? false : { scale: 0.12, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.85, delay: 0.18, ease: SMOOTH_EASE }}
                  />

                  {/* Interactive vertices + axis labels */}
                  {radarAxes.map((cat, i) => {
                    const pt = radarDataPoints[i];
                    const labelPt = getRadarPoint(i, 122, radarAxes.length);
                    const isSelected = selectedCategoryIdx === i;
                    return (
                      <g
                        key={cat.name}
                        className="cursor-pointer"
                        onMouseEnter={() => setSelectedCategoryIdx(i)}
                        onClick={() =>
                          setSelectedCategoryIdx((prev) => (prev === i ? null : i))
                        }
                      >
                        {isSelected && !prefersReducedMotion && (
                          <motion.circle
                            cx={pt.x}
                            cy={pt.y}
                            r={11}
                            fill="rgba(240, 171, 252, 0.25)"
                            initial={{ scale: 0.6, opacity: 0.9 }}
                            animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.7, 0.2, 0.7] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                          />
                        )}
                        <motion.circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 6 : 4}
                          fill={isSelected ? "#f0abfc" : "#cac5fe"}
                          stroke="#0c0f1a"
                          strokeWidth="2"
                          initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: 0.4 + i * 0.06 }}
                          style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                        />
                        <text
                          x={labelPt.x}
                          y={labelPt.y}
                          textAnchor={
                            Math.abs(labelPt.x - radarCenter) < 12
                              ? "middle"
                              : labelPt.x > radarCenter
                              ? "start"
                              : "end"
                          }
                          dominantBaseline="middle"
                          className={cn(
                            "text-[9.5px] font-medium transition-colors",
                            isSelected ? "fill-white font-bold" : "fill-zinc-300"
                          )}
                        >
                          {shortenAxisLabel(cat.name)}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="w-full mt-2 px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs flex items-center justify-between gap-2 min-h-[38px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeCategory ? (
                      <motion.div
                        key={activeCategory.name}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="w-full flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-white truncate">
                          {activeCategory.name}
                        </span>
                        <span className="font-mono font-bold text-indigo-300 shrink-0">
                          {activeCategory.score}/100
                        </span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="radar-hint"
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                        className="text-zinc-500 text-[11px]"
                      >
                        {isEs
                          ? "Línea punteada verde = objetivo recomendado (75/100)"
                          : "Green dashed line = recommended target (75/100)"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : null}
          </div>

          {/* Sentiment Breakdown & Animated Score Bars */}
          <div className="lg:col-span-7 rounded-3xl bg-[#0c0f1a] border border-zinc-800/80 p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                    {isEs
                      ? "Sentimiento & Distribución por Dimensión"
                      : "Sentiment & Score Breakdown"}
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isEs
                      ? "Clasificación de competencias según tu desempeño real"
                      : "Competency signal distribution based on your interview"}
                  </p>
                </div>
              </div>

              {/* Animated Sentiment stacked progress bar */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col gap-3">
                <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden flex gap-0.5">
                  {sentimentPercents.positive > 0 && (
                    <motion.div
                      initial={prefersReducedMotion ? false : { width: 0 }}
                      whileInView={{ width: `${sentimentPercents.positive}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.75, delay: 0.15, ease: SMOOTH_EASE }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  )}
                  {sentimentPercents.neutral > 0 && (
                    <motion.div
                      initial={prefersReducedMotion ? false : { width: 0 }}
                      whileInView={{ width: `${sentimentPercents.neutral}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.75, delay: 0.25, ease: SMOOTH_EASE }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                    />
                  )}
                  {sentimentPercents.critical > 0 && (
                    <motion.div
                      initial={prefersReducedMotion ? false : { width: 0 }}
                      whileInView={{ width: `${sentimentPercents.critical}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.75, delay: 0.35, ease: SMOOTH_EASE }}
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px]">
                        {isEs ? "Fuerte (≥70)" : "Strong (≥70)"}
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {sentimentPercents.positive}%{" "}
                        <span className="text-zinc-500 font-normal">
                          ({sentimentCounts.positive})
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px]">
                        {isEs ? "Intermedio (40–69)" : "Neutral (40–69)"}
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {sentimentPercents.neutral}%{" "}
                        <span className="text-zinc-500 font-normal">
                          ({sentimentCounts.neutral})
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px]">
                        {isEs ? "Crítico (<40)" : "Critical (<40)"}
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {sentimentPercents.critical}%{" "}
                        <span className="text-zinc-500 font-normal">
                          ({sentimentCounts.critical})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animated Horizontal Bar Chart with 75 benchmark line */}
            <div className="flex flex-col gap-3">
              {categoryScores.map((cat, idx) => {
                const sentiment = classifyScore(cat.score);
                const barGradient =
                  sentiment === "positive"
                    ? "from-emerald-500 to-teal-400"
                    : sentiment === "neutral"
                    ? "from-amber-500 to-yellow-400"
                    : "from-rose-500 to-pink-500";
                const isSelected = selectedCategoryIdx === idx;

                return (
                  <motion.button
                    key={cat.name}
                    type="button"
                    whileHover={prefersReducedMotion ? undefined : { x: 3 }}
                    transition={{ duration: 0.18 }}
                    onClick={() =>
                      setSelectedCategoryIdx((prev) => (prev === idx ? null : idx))
                    }
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer",
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500/40"
                        : "bg-zinc-950/50 border-transparent hover:border-zinc-800"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-medium text-zinc-200 truncate">
                        {idx + 1}. {cat.name}
                      </span>
                      <span className="font-mono font-bold text-white tabular-nums shrink-0">
                        {cat.score}
                        <span className="text-zinc-500 font-normal">/100</span>
                      </span>
                    </div>
                    <div className="relative w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                      <motion.div
                        initial={prefersReducedMotion ? false : { scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.75,
                          delay: 0.12 + idx * 0.07,
                          ease: SMOOTH_EASE,
                        }}
                        style={{
                          width: `${Math.max(cat.score, 2)}%`,
                          transformOrigin: "left",
                        }}
                        className={cn("h-full rounded-full bg-gradient-to-r", barGradient)}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute top-0 bottom-0 w-[1.5px] bg-white/40"
                        style={{ left: `${hiringBenchmark}%` }}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 4. Detailed Themes & Competency Commentary (Sliding Tab Pill + AnimatePresence) ── */}
      {categoryScores.length > 0 && (
        <motion.div
          {...sectionReveal(0.08)}
          className="rounded-3xl bg-[#0c0f1a] border border-zinc-800/80 p-6 md:p-7 flex flex-col gap-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEs ? "Desglose Detallado por Competencia" : "Detailed Competency Insights"}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isEs
                  ? "Análisis cualitativo de cada área evaluada durante la entrevista"
                  : "Qualitative feedback across each evaluated interview theme"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: isEs ? "Todas" : "All", count: categoryScores.length },
                  {
                    id: "positive",
                    label: isEs ? "Fuertes" : "Strong",
                    count: sentimentCounts.positive,
                  },
                  {
                    id: "neutral",
                    label: isEs ? "Intermedias" : "Neutral",
                    count: sentimentCounts.neutral,
                  },
                  {
                    id: "critical",
                    label: isEs ? "Críticas" : "Critical",
                    count: sentimentCounts.critical,
                  },
                ] as const
              ).map((tab) => {
                const isActiveTab = themeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isActiveTab}
                    onClick={() => setThemeFilter(tab.id)}
                    className={cn(
                      "relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer",
                      isActiveTab
                        ? "border-indigo-400/40 text-indigo-100"
                        : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    {isActiveTab && (
                      <motion.span
                        layoutId="feedbackThemeTabPill"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-indigo-500/20 -z-0"
                      />
                    )}
                    <span className="relative z-10">
                      {tab.label} <span className="opacity-70">({tab.count})</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredCategories.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filteredCategories.map((cat, idx) => {
                  const pillStyle =
                    cat.sentiment === "positive"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : cat.sentiment === "neutral"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/30";
                  const pillText =
                    cat.sentiment === "positive"
                      ? isEs
                        ? "Destacado"
                        : "Strong"
                      : cat.sentiment === "neutral"
                      ? isEs
                        ? "En progreso"
                        : "Developing"
                      : isEs
                      ? "Prioritario"
                      : "Priority";

                  return (
                    <motion.div
                      key={cat.originalIndex}
                      layout
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
                      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                      transition={{ duration: 0.32, delay: idx * 0.04, ease: SMOOTH_EASE }}
                      className="p-5 rounded-2xl bg-zinc-950/65 border border-zinc-800/80 hover:border-indigo-500/35 transition-colors flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-bold shrink-0">
                            {cat.originalIndex + 1}
                          </span>
                          <h3 className="text-sm font-bold text-white leading-snug">
                            {cat.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              pillStyle
                            )}
                          >
                            {pillText}
                          </span>
                          <span className="font-mono text-sm font-extrabold text-white tabular-nums">
                            {cat.score}
                            <span className="text-zinc-500 text-xs font-normal">/100</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {cat.comment}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty-filter"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/70 text-center text-xs text-zinc-400"
              >
                {isEs
                  ? "No hay dimensiones en esta categoría de filtro."
                  : "No competencies match this filter."}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── 5. Strengths vs. Areas for Improvement (Staggered 2-Column Cards) ── */}
      <motion.div {...sectionReveal(0.1)} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950/20 via-[#0c0f1a] to-[#0c0f1a] border border-emerald-500/20 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isEs ? "Fortalezas Detectadas" : "Key Strengths"}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {isEs ? "Puntos sólidos a mantener en futuras rondas" : "Solid signals to maintain"}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold">
              {strengths.length}
            </span>
          </div>

          {strengths.length > 0 ? (
            <ul className="list-none pl-0 flex flex-col gap-2.5">
              {strengths.map((item, i) => (
                <motion.li
                  key={i}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: SMOOTH_EASE }}
                  className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 hover:border-emerald-400/35 transition-colors text-sm text-zinc-200 leading-relaxed flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400 leading-relaxed">
              <MinusCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <span>
                {isEs
                  ? "Aún no se registraron fortalezas destacadas en esta sesión. Responde al menos 2–3 preguntas técnicas en tu próximo intento para obtener un perfil completo."
                  : "No standout strengths were captured in this session yet. Answer at least 2–3 technical questions in your next attempt to unlock a complete profile."}
              </span>
            </div>
          )}
        </div>

        {/* Areas for Improvement */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-950/20 via-[#0c0f1a] to-[#0c0f1a] border border-amber-500/20 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-amber-500/15 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isEs ? "Plan de Mejora Prioritario" : "Priority Areas to Improve"}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {isEs ? "Acciones concretas para elevar tu puntaje" : "Actionable steps to boost your score"}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold">
              {areasForImprovement.length}
            </span>
          </div>

          {areasForImprovement.length > 0 ? (
            <ul className="list-none pl-0 flex flex-col gap-2.5">
              {areasForImprovement.map((item, i) => (
                <motion.li
                  key={i}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: SMOOTH_EASE }}
                  className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 hover:border-amber-400/35 transition-colors text-sm text-zinc-200 leading-relaxed flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400">
              {isEs
                ? "No se detectaron áreas críticas de mejora en esta evaluación."
                : "No critical improvement areas were flagged."}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
