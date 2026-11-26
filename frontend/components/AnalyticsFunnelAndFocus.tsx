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
  LabelList,
} from "recharts";
import {
  Briefcase,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  Filter,
  ChevronDown,
  CheckCircle2,
  Circle,
  TrendingUp,
} from "lucide-react";
import SimulationMarqueeButton from "./SimulationMarqueeButton";

export interface FocusBlindspotItem {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  action: string;
  category: string;
}

interface AnalyticsFunnelAndFocusProps {
  totalApplications: number;
  interviewingApplications: number;
  offeredApplications: number;
  rejectedApplications: number;
  blindspots: FocusBlindspotItem[];
  chartAnimKey?: number;
}

const CHART_EASE = [0.22, 1, 0.36, 1] as const;
const COMPLETED_FOCUS_STORAGE_KEY = "devcareer_analytics_completed_focus_v1";

interface FunnelTooltipPayload {
  payload?: {
    stage: string;
    count: number;
    rate: number;
    hint: string;
  };
}

function FunnelBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: FunnelTooltipPayload[];
}) {
  if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  return (
    <div className="px-3.5 py-2.5 rounded-xl bg-[#0b0d17]/95 border border-indigo-500/35 shadow-2xl backdrop-blur-md text-xs max-w-[220px]">
      <p className="font-bold text-white mb-1">{item.stage}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-zinc-400">Vacantes:</span>
        <span className="font-mono font-extrabold text-indigo-300">{item.count}</span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-zinc-400">Conversión:</span>
        <span className="font-mono font-bold text-emerald-400">{item.rate}%</span>
      </div>
      <p className="text-[10px] text-zinc-400 mt-1.5 pt-1.5 border-t border-zinc-800 leading-snug">
        {item.hint}
      </p>
    </div>
  );
}

export default function AnalyticsFunnelAndFocus({
  totalApplications,
  interviewingApplications,
  offeredApplications,
  rejectedApplications,
  blindspots,
  chartAnimKey = 0,
}: AnalyticsFunnelAndFocusProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  // ── State: Embudo de Postulaciones ──
  const [funnelView, setFunnelView] = useState<"funnel" | "chart">("funnel");
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  // ── State: ¿En qué enfocarte para mejorar? ──
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [expandedFocusId, setExpandedFocusId] = useState<string | null>(
    blindspots[0]?.id ?? null
  );
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(COMPLETED_FOCUS_STORAGE_KEY);
      if (!saved) return [];
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === "string")
        : [];
    } catch {
      return [];
    }
  });

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(COMPLETED_FOCUS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const interviewRate =
    totalApplications > 0
      ? Math.round((interviewingApplications / totalApplications) * 100)
      : 0;

  const offerRate =
    totalApplications > 0
      ? Math.round((offeredApplications / totalApplications) * 100)
      : 0;

  const interviewToOfferRate =
    interviewingApplications > 0
      ? Math.round((offeredApplications / interviewingApplications) * 100)
      : 0;

  const funnelStages = useMemo(
    () => [
      {
        step: 1,
        short: "Enviadas",
        title: "Postulaciones Enviadas",
        desc: "Currículum enviado a vacantes activas",
        count: totalApplications,
        percent: totalApplications > 0 ? 100 : 0,
        percentLabel: "100% inicio",
        tip:
          totalApplications < 5
            ? "Aumenta el volumen usando Smart Match para postular a vacantes con >80% de afinidad."
            : "Buen ritmo de postulaciones. Prioriza personalizar el CV con palabras clave ATS.",
        ctaLabel: "Explorar vacantes con Smart Match",
        ctaHref: "/jobs",
        boxClass: "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700",
        activeBoxClass: "bg-zinc-900 border-indigo-400/50 shadow-lg shadow-indigo-950/30",
        badgeClass: "bg-zinc-800 text-zinc-200",
        countClass: "text-white",
        subClass: "text-zinc-400",
        barClass: "from-zinc-300 to-zinc-400",
        hex: "#a1a1aa",
      },
      {
        step: 2,
        short: "Entrevista",
        title: "En Proceso de Entrevista",
        desc: "Evaluaciones técnicas y filtros activos",
        count: interviewingApplications,
        percent: interviewRate,
        percentLabel: `${interviewRate}% avance`,
        tip:
          interviewingApplications === 0
            ? "Aún no avanzas a entrevista. Optimiza tu CV en CV & ATS Hub para pasar filtros automáticos."
            : "Prepara cada entrevista con simulaciones de voz IA enfocadas en el stack de la vacante.",
        ctaLabel: interviewingApplications === 0 ? "Optimizar CV en ATS Hub" : "Practicar entrevista IA",
        ctaHref: interviewingApplications === 0 ? "/cv" : "/interview",
        boxClass: "bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-400/50",
        activeBoxClass: "bg-indigo-500/15 border-indigo-400/60 shadow-lg shadow-indigo-950/40",
        badgeClass: "bg-indigo-500/20 text-indigo-300",
        countClass: "text-indigo-300",
        subClass: "text-indigo-300",
        barClass: "from-indigo-500 to-violet-400",
        hex: "#818cf8",
      },
      {
        step: 3,
        short: "Ofertas",
        title: "Ofertas Finales Recibidas",
        desc: "Propuesta económica y técnica lista",
        count: offeredApplications,
        percent: offerRate,
        percentLabel: `${offerRate}% éxito final`,
        tip:
          offeredApplications === 0
            ? "Refuerza algoritmos, patrones GoF y respuestas STAR para convertir tus entrevistas en ofertas."
            : "¡Excelente conversión! Compara compensación, impacto técnico y crecimiento antes de aceptar.",
        ctaLabel: "Entrenar retos técnicos GoF",
        ctaHref: "/code-challenge",
        boxClass: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/50",
        activeBoxClass: "bg-emerald-500/15 border-emerald-400/60 shadow-lg shadow-emerald-950/40",
        badgeClass: "bg-emerald-500/20 text-emerald-300",
        countClass: "text-emerald-400",
        subClass: "text-emerald-300",
        barClass: "from-emerald-500 to-teal-400",
        hex: "#34d399",
      },
    ],
    [interviewRate, interviewingApplications, offerRate, offeredApplications, totalApplications]
  );

  const funnelChartData = useMemo(() => {
    const base = funnelStages.map((s) => ({
      short: s.short,
      stage: s.title,
      count: s.count,
      rate: s.percent,
      hint: s.tip,
      hex: s.hex,
    }));
    if (rejectedApplications > 0) {
      base.push({
        short: "Cerradas",
        stage: "Procesos Cerrados / Rechazados",
        count: rejectedApplications,
        rate:
          totalApplications > 0
            ? Math.round((rejectedApplications / totalApplications) * 100)
            : 0,
        hint: "Usa el feedback de entrevistas previas para reforzar brechas antes de re-postular.",
        hex: "#fb7185",
      });
    }
    return base;
  }, [funnelStages, rejectedApplications, totalApplications]);

  const visibleBlindspots = useMemo(() => blindspots.slice(0, 4), [blindspots]);

  const severityCounts = useMemo(
    () => ({
      all: visibleBlindspots.length,
      high: visibleBlindspots.filter((b) => b.severity === "high").length,
      medium: visibleBlindspots.filter((b) => b.severity === "medium").length,
      low: visibleBlindspots.filter((b) => b.severity === "low").length,
    }),
    [visibleBlindspots]
  );

  const filteredBlindspots = useMemo(
    () =>
      visibleBlindspots.filter((item) =>
        severityFilter === "all" ? true : item.severity === severityFilter
      ),
    [severityFilter, visibleBlindspots]
  );

  const completedCount = useMemo(
    () =>
      visibleBlindspots.filter((item, idx) =>
        completedIds.includes(item.id || `focus-${idx}`)
      ).length,
    [completedIds, visibleBlindspots]
  );

  const completionPct =
    visibleBlindspots.length > 0
      ? Math.round((completedCount / visibleBlindspots.length) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ═════════ GRÁFICA 7: EMBUDO DE POSTULACIONES INTERACTIVO ═════════ */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Embudo de Postulaciones
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Haz clic en cada etapa para ver recomendaciones y métricas de conversión.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-semibold">
              {(
                [
                  { id: "funnel", label: "Embudo", icon: <Filter className="w-3 h-3" /> },
                  { id: "chart", label: "Gráfico", icon: <BarChart3 className="w-3 h-3" /> },
                ] as const
              ).map((tab) => {
                const active = funnelView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFunnelView(tab.id)}
                    aria-pressed={active}
                    className={`relative px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="funnelViewModePill"
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
              href="/jobs?tab=applications"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 whitespace-nowrap"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="py-4 min-h-[270px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {funnelView === "funnel" ? (
              <motion.div
                key={`funnel-steps-${chartAnimKey}`}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                {funnelStages.map((stage, idx) => {
                  const isOpen = selectedStage === stage.step;
                  const stepConversionLabel =
                    idx === 1
                      ? `${interviewRate}% pasaron a entrevista`
                      : idx === 2
                      ? `${interviewToOfferRate}% de entrevistas a oferta`
                      : null;

                  return (
                    <React.Fragment key={stage.step}>
                      {stepConversionLabel && (
                        <div className="flex items-center justify-center gap-2 py-0.5 text-[10px] font-mono text-zinc-500">
                          <span className="h-3 w-px bg-zinc-700" />
                          <span>↓ {stepConversionLabel}</span>
                          <span className="h-3 w-px bg-zinc-700" />
                        </div>
                      )}

                      <motion.div
                        layout
                        transition={{ duration: 0.24, ease: CHART_EASE }}
                        className={`rounded-2xl border transition-colors ${
                          isOpen ? stage.activeBoxClass : stage.boxClass
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStage((prev) => (prev === stage.step ? null : stage.step))
                          }
                          aria-expanded={isOpen}
                          className="w-full p-3.5 text-left flex flex-col gap-2.5 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 ${stage.badgeClass}`}
                              >
                                {stage.step}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span className="truncate">{stage.title}</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                                      isOpen ? "rotate-180 text-white" : ""
                                    }`}
                                  />
                                </span>
                                <span className="text-[10px] text-zinc-400 block truncate">
                                  {stage.desc}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-lg font-black font-mono ${stage.countClass}`}>
                                {stage.count}
                              </span>
                              <span className={`text-[10px] block font-mono ${stage.subClass}`}>
                                {stage.percentLabel}
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-zinc-950/75 overflow-hidden">
                            <motion.div
                              initial={prefersReducedMotion ? false : { scaleX: 0 }}
                              whileInView={{ scaleX: 1 }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 0.75,
                                delay: 0.1 + idx * 0.12,
                                ease: CHART_EASE,
                              }}
                              style={{
                                width: `${Math.max(stage.percent, stage.count > 0 ? 8 : 0)}%`,
                                transformOrigin: "left",
                              }}
                              className={`h-full rounded-full bg-gradient-to-r ${stage.barClass}`}
                            />
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: CHART_EASE }}
                              className="overflow-hidden"
                            >
                              <div className="px-3.5 pb-3.5 pt-2 border-t border-white/[0.06] flex flex-col gap-2">
                                <p className="text-[11px] text-zinc-300 leading-relaxed">
                                  {stage.tip}
                                </p>
                                <Link
                                  href={stage.ctaHref}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 w-fit"
                                >
                                  <span>{stage.ctaLabel}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key={`funnel-chart-${chartAnimKey}`}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-[240px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelChartData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <XAxis
                      dataKey="short"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#d4d4d8", fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <Tooltip
                      content={<FunnelBarTooltip />}
                      cursor={{ fill: "rgba(99, 102, 241, 0.08)", radius: 10 }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[10, 10, 4, 4]}
                      maxBarSize={52}
                      isAnimationActive={!prefersReducedMotion}
                      animationDuration={800}
                    >
                      {funnelChartData.map((entry) => (
                        <Cell key={entry.short} fill={entry.hex} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        offset={6}
                        style={{
                          fill: "#ffffff",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "monospace",
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Efectividad a entrevista:</span>
            <span className="font-bold font-mono text-indigo-300 text-sm">
              {interviewRate}%
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Conversión a oferta:</span>
            <span className="font-bold font-mono text-emerald-400 text-sm">
              {offerRate}%
            </span>
          </div>
        </div>
      </div>

      {/* ═════════ APARTADO 8: ¿EN QUÉ ENFOCARTE PARA MEJORAR? (INTERACTIVO) ═════════ */}
      <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
        <div className="flex flex-col gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                ¿En qué enfocarte para mejorar?
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Filtra por prioridad, marca lo ya practicado o despliega el plan sugerido.
              </p>
            </div>
            <Link
              href="/code-challenge"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 whitespace-nowrap"
            >
              <span>Practicar retos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Barra de filtros por prioridad + progreso del plan */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: "all", label: "Todas", count: severityCounts.all },
                  { id: "high", label: "Prioritario", count: severityCounts.high },
                  { id: "medium", label: "Recomendado", count: severityCounts.medium },
                  { id: "low", label: "Sugerencia", count: severityCounts.low },
                ] as const
              ).map((tab) => {
                const isActive = severityFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSeverityFilter(tab.id)}
                    aria-pressed={isActive}
                    className={`relative px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/60"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="focusSeverityFilterPill"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-indigo-500/25 border border-indigo-400/40"
                      />
                    )}
                    <span className="relative z-10">
                      {tab.label} ({tab.count})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Plan:{" "}
                <strong className="text-emerald-400">
                  {completedCount}/{visibleBlindspots.length}
                </strong>
              </span>
              <div className="w-14 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.35, ease: CHART_EASE }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lista interactiva con checklist y acordeón */}
        <div className="py-3 space-y-2.5 flex-1">
          <AnimatePresence mode="popLayout">
            {filteredBlindspots.length > 0 ? (
              filteredBlindspots.map((item, idx) => {
                const itemId = item.id || `focus-${idx}`;
                const isDone = completedIds.includes(itemId);
                const isExpanded = expandedFocusId === itemId;
                const isVoiceTopic =
                  /comunicaci|voz|claridad|star|entrevista/i.test(
                    `${item.title} ${item.category} ${item.detail}`
                  );

                return (
                  <motion.div
                    key={itemId}
                    layout
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: CHART_EASE }}
                    className={`rounded-2xl border transition-colors ${
                      isDone
                        ? "bg-emerald-950/15 border-emerald-500/25"
                        : isExpanded
                        ? "bg-zinc-900/90 border-indigo-500/40"
                        : "bg-zinc-900/65 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="p-3.5 flex items-start gap-2.5">
                      {/* Botón interactivo de checklist */}
                      <button
                        type="button"
                        onClick={() => toggleCompleted(itemId)}
                        aria-label={
                          isDone
                            ? `Desmarcar "${item.title}" como practicado`
                            : `Marcar "${item.title}" como practicado`
                        }
                        title={isDone ? "Practicado (clic para desmarcar)" : "Marcar como practicado"}
                        className="mt-0.5 shrink-0 cursor-pointer text-zinc-500 hover:text-emerald-400 transition-colors"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      {/* Área desplegable del consejo */}
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFocusId((prev) => (prev === itemId ? null : itemId))
                          }
                          aria-expanded={isExpanded}
                          className="w-full text-left flex items-center justify-between gap-2 flex-wrap cursor-pointer"
                        >
                          <h4
                            className={`text-xs font-bold tracking-wide transition-colors ${
                              isDone ? "text-zinc-400 line-through" : "text-white"
                            }`}
                          >
                            {item.title}
                          </h4>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                                {item.category}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                item.severity === "high"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : item.severity === "medium"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              }`}
                            >
                              {item.severity === "high"
                                ? "Prioritario"
                                : item.severity === "medium"
                                ? "Recomendado"
                                : "Sugerencia"}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-indigo-300" : ""
                              }`}
                            />
                          </div>
                        </button>

                        <p className="text-xs text-zinc-300 leading-relaxed mt-1.5 break-words whitespace-normal">
                          {item.detail}
                        </p>

                        <AnimatePresence initial={false}>
                          {isExpanded && item.action && (
                            <motion.div
                              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: CHART_EASE }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col gap-2">
                                <div className="flex items-start gap-2 text-xs">
                                  <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                  <span className="text-zinc-400 leading-snug">
                                    <strong className="text-zinc-200">Acción sugerida:</strong>{" "}
                                    {item.action}
                                  </span>
                                </div>
                                <div className="flex items-center justify-end">
                                  <Link
                                    href={isVoiceTopic ? "/interview" : "/code-challenge"}
                                    className="text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                                  >
                                    <span>
                                      {isVoiceTopic
                                        ? "Practicar en entrevista de voz"
                                        : "Resolver reto relacionado"}
                                    </span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                key="empty-focus"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-400"
              >
                No hay recomendaciones en este nivel de prioridad.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botón de Acción Principal */}
        <div className="pt-2">
          <SimulationMarqueeButton
            href="/interview"
            label="Hacer una Simulación Completa (Voz + Código)"
          />
        </div>
      </div>
    </div>
  );
}
