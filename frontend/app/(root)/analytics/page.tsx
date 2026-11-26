"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Flame,
  Mic,
  Code2,
  Activity,
  Briefcase,
  RefreshCw,
  Trophy,
} from "lucide-react";
import DashboardExportActions from "@/components/DashboardExportActions";
import AiLoader from "@/components/AiLoader";
import SmoothLineGraph from "@/components/SmoothLineGraph";
import AnalyticsRechartsPair from "@/components/AnalyticsRechartsPair";
import ChallengesDonutChart from "@/components/ChallengesDonutChart";
import AnalyticsMasteryAndHeatmap from "@/components/AnalyticsMasteryAndHeatmap";
import AnalyticsFunnelAndFocus from "@/components/AnalyticsFunnelAndFocus";
import AnalyticsMetricCard from "@/components/AnalyticsMetricCard";
import StardustCursorBackdrop from "@/components/StardustCursorBackdrop";

// ── Tipos de Datos ──
interface PillarMetric {
  name: string;
  score: number;
  benchmark: number;
  status: string;
}

interface WeeklyPoint {
  day: string;
  score: number;
  target: number;
}

interface BlindspotItem {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  action: string;
  category: string;
}

interface ActivityItem {
  id: string;
  type: "application" | "interview" | "challenge";
  title: string;
  company: string;
  timestamp: string;
  score?: number;
  status: string;
}

interface AnalyticsData {
  userId: string;
  readinessScore: number;
  readinessLevel: string;
  targetDelta: string;
  metrics: {
    totalInterviews: number;
    challengesCompleted: number;
    challengeSuccessRate: number;
    activeStreakDays: number;
    practiceHoursMonth: number;
    totalApplications: number;
    interviewingApplications: number;
    offeredApplications: number;
    rejectedApplications: number;
  };
  pillars: PillarMetric[];
  weeklyProgress: WeeklyPoint[];
  blindspots: BlindspotItem[];
  recentActivity: ActivityItem[];
}

// ── Datos por Defecto (Fallback amigable) ──
const DEFAULT_ANALYTICS: AnalyticsData = {
  userId: "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
  readinessScore: 84,
  readinessLevel: "Preparado para Nivel Senior",
  targetDelta: "+5.4 pts este mes",
  metrics: {
    totalInterviews: 6,
    challengesCompleted: 24,
    challengeSuccessRate: 78,
    activeStreakDays: 8,
    practiceHoursMonth: 42,
    totalApplications: 3,
    interviewingApplications: 1,
    offeredApplications: 1,
    rejectedApplications: 0,
  },
  pillars: [
    { name: "Conocimiento Técnico", score: 86, benchmark: 80, status: "Sobresaliente" },
    { name: "Comunicación en Entrevista", score: 82, benchmark: 75, status: "Óptimo" },
    { name: "Resolución de Problemas", score: 79, benchmark: 80, status: "Aceptable" },
    { name: "Ajuste a la Empresa", score: 88, benchmark: 75, status: "Excelente" },
    { name: "Confianza & Fluidez", score: 84, benchmark: 75, status: "Excelente" },
  ],
  weeklyProgress: [
    { day: "Lun", score: 68, target: 75 },
    { day: "Mar", score: 74, target: 75 },
    { day: "Mié", score: 72, target: 75 },
    { day: "Jue", score: 85, target: 75 },
    { day: "Vie", score: 79, target: 75 },
    { day: "Sáb", score: 88, target: 75 },
    { day: "Dom", score: 84, target: 75 },
  ],
  blindspots: [
    {
      id: "bs-1",
      severity: "high",
      title: "Profundidad en Ejemplos Técnicos",
      detail: "Profundizar en ejemplos técnicos en futuras sesiones, describiendo la arquitectura y las razones de las decisiones tomadas.",
      action: "Estructura la intervención técnica con contexto, arquitectura, decisión de diseño y resultado medible.",
      category: "Comunicación Técnica",
    },
    {
      id: "bs-2",
      severity: "medium",
      title: "Elaboración y Extensión de Respuestas",
      detail: "Profundizar en las respuestas en lugar de limitarse a frases cortas o monosílabos al responder sobre patrones y microservicios.",
      action: "Aplica el framework STAR cuantificando métricas de disponibilidad y rendimiento.",
      category: "Precisión Conceptual",
    },
    {
      id: "bs-3",
      severity: "low",
      title: "Demostración de Competencias Clave",
      detail: "Esperar a que se desarrollen las preguntas de la entrevista para mostrar competencias clave de resiliencia y concurrencia.",
      action: "Conecta la pregunta del reclutador con casos reales de producción donde implementaste resiliencia.",
      category: "Estructura de Respuesta",
    },
  ],
  recentActivity: [
    {
      id: "act-app-0",
      type: "application",
      title: "Postulación: Senior Backend Engineer",
      company: "GitLab",
      timestamp: "Hoy, 10:30 h",
      status: "En Entrevista",
    },
    {
      id: "act-chal-1",
      type: "challenge",
      title: "Reto Técnico: Patrón Visitor & Doble Despacho",
      company: "Arena de Código",
      timestamp: "Ayer, 16:45 h",
      score: 95,
      status: "Aprobado",
    },
    {
      id: "act-int-1",
      type: "interview",
      title: "Simulación de Arquitectura & Microservicios",
      company: "Evaluador AI",
      timestamp: "Hace 2 días",
      score: 88,
      status: "Completada",
    },
  ],
};

// ── Coordenadas del Radar Multiaxial ──
const RADAR_AXES_METRICS = [
  { label: "Conocimiento Técnico", angle: -90, score: 86, benchmark: 80 },
  { label: "Comunicación", angle: -18, score: 82, benchmark: 75 },
  { label: "Resolución Problemas", angle: 54, score: 79, benchmark: 80 },
  { label: "Ajuste a Empresa", angle: 126, score: 88, benchmark: 75 },
  { label: "Confianza & Fluidez", angle: 198, score: 84, benchmark: 75 },
];

// ── Datos para la Curva de Evolución Histórica (7 Sesiones) ──
const HISTORICAL_TREND = [
  { session: "S1", date: "02 Nov", score: 65, tag: "Diagnóstico Inicial" },
  { session: "S2", date: "05 Nov", score: 72, tag: "Patrón Factory" },
  { session: "S3", date: "08 Nov", score: 70, tag: "Estructuras de Datos" },
  { session: "S4", date: "11 Nov", score: 78, tag: "Patrón Observer" },
  { session: "S5", date: "14 Nov", score: 82, tag: "Simulación Técnica" },
  { session: "S6", date: "17 Nov", score: 85, tag: "Patrón Visitor" },
  { session: "S7", date: "Hoy", score: 89, tag: "Reto Dual 360°" },
];

// ── Matriz de Dominio por Área Técnica ──
const TECHNICAL_MASTERY_AREAS = [
  {
    name: "Patrones GoF & Arquitectura Limpia",
    score: 92,
    benchmark: 80,
    status: "Dominado",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    barColor: "from-emerald-500 to-teal-400",
  },
  {
    name: "Estructuras de Datos & Complejidad Big-O",
    score: 84,
    benchmark: 75,
    status: "Avanzado",
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    barColor: "from-indigo-500 to-blue-400",
  },
  {
    name: "Diseño de APIs RESTful & Microservicios",
    score: 78,
    benchmark: 75,
    status: "Competente",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    barColor: "from-cyan-500 to-sky-400",
  },
  {
    name: "Bases de Datos & Control de Concurrencia",
    score: 75,
    benchmark: 70,
    status: "Competente",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    barColor: "from-amber-500 to-orange-400",
  },
  {
    name: "Comunicación Técnica & Metodología STAR",
    score: 88,
    benchmark: 80,
    status: "Sobresaliente",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    barColor: "from-purple-500 to-pink-400",
  },
];

const CHART_EASE = [0.22, 1, 0.36, 1] as const;

export default function AnalyticsPage() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [data, setData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");
  const [chartAnimKey, setChartAnimKey] = useState<number>(0);

  const fetchAnalytics = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/proxy/feedback/user/analytics-summary", {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.summary) {
          setData(json.summary);
        }
      }
    } catch (err) {
      console.warn("Usando datos de fallback amigable", err);
    } finally {
      setIsRefreshing(false);
      if (showRefreshIndicator) setChartAnimKey((k) => k + 1);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/proxy/feedback/user/analytics-summary", {
          cache: "no-store",
        });
        if (active && res.ok) {
          const json = await res.json();
          if (json.success && json.summary) {
            setData(json.summary);
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic analytics, using persistent fallback", err);
      } finally {
        if (active) setIsInitialLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ── Datos del Radar de Habilidades para Recharts ──
  const radarAxes =
    data.pillars && data.pillars.length === 5
      ? data.pillars.map((p) => ({
        label: p.name.replace(" en Entrevista", "").replace(" & Fluidez", ""),
        score: p.score,
        benchmark: p.benchmark,
      }))
      : RADAR_AXES_METRICS.map((m) => ({
        label: m.label,
        score: m.score,
        benchmark: m.benchmark,
      }));

  // ── Datos para SmoothLineGraph (Curva de Evolución Histórica) ──
  const smoothTrendData = HISTORICAL_TREND.map((pt) => ({
    label: pt.date,
    value: pt.score,
    sublabel: `${pt.date} · ${pt.tag || pt.session}`,
  }));

  if (isInitialLoading) {
    return (
      <div className="min-h-[65vh] w-full flex items-center justify-center p-6">
        <AiLoader
          size={0.95}
          label="Cargando Progreso & Analytics..."
          sublabel="Calculando tu radar de competencias, rachas y evolución histórica"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16 px-4 sm:px-6">
      {/* ── Sección Superior con Fondo Interactivo Stardust Cursor (Header + 4 KPIs + Tabs) ── */}
      <StardustCursorBackdrop>
        {/* ── Encabezado Principal ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Mi Progreso & Estadísticas
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Panel integral de métricas técnicas, gráficas de rendimiento y recomendaciones de mejora.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`}
            />
            <span>{isRefreshing ? "Actualizando..." : "Actualizar"}</span>
          </button>

          <DashboardExportActions />
        </div>
      </div>

      {/* ── 4 Tarjetas de Métricas Clave ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Puntuación de Nivel */}
        <AnalyticsMetricCard highlighted>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Nivel de Preparación</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">
                {data.readinessScore}
              </span>
              <span className="text-xs text-zinc-500 font-mono">/ 100</span>
            </div>
            <p className="text-xs font-semibold text-emerald-400 mt-1">
              {data.readinessLevel}
            </p>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <motion.div
              key={`readiness-${chartAnimKey}`}
              initial={prefersReducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, ease: CHART_EASE }}
              style={{ width: `${data.readinessScore}%`, transformOrigin: "left" }}
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
            />
          </div>
        </AnalyticsMetricCard>

        {/* Tarjeta 2: Entrevistas por Voz */}
        <AnalyticsMetricCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Entrevistas por Voz</span>
            <Mic className="w-4 h-4 text-pink-400" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">
                {data.metrics.totalInterviews}
              </span>
              <span className="text-xs text-zinc-500">sesiones</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Nivel evaluado: <strong className="text-zinc-200">B2 / C1 Profesional</strong>
            </p>
          </div>
          <span className="text-[11px] text-pink-400 font-medium">
            Simulaciones con IA conversacional
          </span>
        </AnalyticsMetricCard>

        {/* Tarjeta 3: Retos de Código */}
        <AnalyticsMetricCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Retos de Código</span>
            <Code2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">
                {data.metrics.challengesCompleted}
              </span>
              <span className="text-xs text-zinc-500">resueltos</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 font-medium">
              {data.metrics.challengeSuccessRate}% de pruebas aprobadas
            </p>
          </div>
          <span className="text-[11px] text-cyan-400 font-medium">
            Algoritmos y Patrones GoF
          </span>
        </AnalyticsMetricCard>

        {/* Tarjeta 4: Racha de Estudio */}
        <AnalyticsMetricCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Racha de Práctica</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">
                {data.metrics.activeStreakDays}
              </span>
              <span className="text-xs text-zinc-500">días seguidos</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {data.metrics.practiceHoursMonth} horas practicadas este mes
            </p>
          </div>
          <span className="text-[11px] text-amber-400 font-medium">
            ¡Excelente constancia activa!
          </span>
        </AnalyticsMetricCard>
      </div>

      {/* ── Navegación entre Pestañas ── */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === "overview"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Panel Gráfico Principal</span>
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeTab === "activity"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
        >
          <Activity className="w-4 h-4" />
          <span>Historial de Prácticas</span>
        </button>
      </div>
      </StardustCursorBackdrop>

      {/* ── VISTA PRINCIPAL: MÚLTIPLES GRÁFICAS VISUALES ── */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {/* ═════════ FILA 1: RENDIMIENTO SEMANAL + RADAR MULTIAXIAL (RECHARTS) ═════════ */}
          <AnalyticsRechartsPair
            weeklyProgress={data.weeklyProgress}
            radarAxes={radarAxes}
            chartAnimKey={chartAnimKey}
          />

          {/* ═════════ FILA 2: CURVA DE EVOLUCIÓN HISTÓRICA + DONUT DE DESAFÍOS ═════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 3: Curva de Tendencia y Progresión Histórica (Smooth Bezier Line/Area Chart SVG) */}
            <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Curva de Evolución Histórica
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Progresión del puntaje global a través de tus últimas sesiones y retos.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>+24 pts de ganancia</span>
                </div>
              </div>

              {/* Smooth Animated Line Graph */}
              <SmoothLineGraph
                data={smoothTrendData}
                minValue={50}
                maxValue={100}
                targetValue={80}
                unit="pts"
                animationKey={chartAnimKey}
              />

              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-zinc-800 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <span className="text-zinc-500 text-[10px] block uppercase font-bold">Puntaje Base</span>
                  <span className="font-bold font-mono text-zinc-300 text-sm">65 pts (S1)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <span className="text-zinc-500 text-[10px] block uppercase font-bold">Rendimiento Actual</span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">89 pts (Hoy)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <span className="text-zinc-500 text-[10px] block uppercase font-bold">Consistencia</span>
                  <span className="font-bold font-mono text-indigo-400 text-sm">Alta (Ascendente)</span>
                </div>
              </div>
            </div>

            {/* Gráfica 4: Desglose de Desafíos Técnicos (Recharts Interactive Donut) */}
            <ChallengesDonutChart
              challengesCompleted={data.metrics.challengesCompleted}
              challengeSuccessRate={data.metrics.challengeSuccessRate}
              chartAnimKey={chartAnimKey}
            />
          </div>

          {/* ═════════ FILA 3: MATRIZ DE DOMINIO TÉCNICO + MAPA DE CALOR (INTERACTIVOS) ═════════ */}
          <AnalyticsMasteryAndHeatmap
            areas={TECHNICAL_MASTERY_AREAS}
            activeStreakDays={data.metrics.activeStreakDays}
            practiceHoursMonth={data.metrics.practiceHoursMonth}
            chartAnimKey={chartAnimKey}
          />

          {/* ═════════ FILA 4: EMBUDO DE POSTULACIONES + PLAN DE MEJORA (INTERACTIVOS) ═════════ */}
          <AnalyticsFunnelAndFocus
            totalApplications={data.metrics.totalApplications}
            interviewingApplications={data.metrics.interviewingApplications}
            offeredApplications={data.metrics.offeredApplications}
            rejectedApplications={data.metrics.rejectedApplications}
            blindspots={data.blindspots}
            chartAnimKey={chartAnimKey}
          />
        </div>
      )}

      {/* ── VISTA DE HISTORIAL DE PRÁCTICAS ── */}
      {activeTab === "activity" && (
        <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 shadow-xl space-y-4">
          <div className="pb-3 border-b border-zinc-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Historial de tus Actividades Técnicas
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Registro ordenado de tus entrevistas de voz, retos resueltos y postulaciones.
            </p>
          </div>

          <div className="space-y-3">
            {data.recentActivity.map((item) => {
              const isApp = item.type === "application";
              const isInt = item.type === "interview";

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isApp
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : isInt
                          ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        }`}
                    >
                      {isApp ? (
                        <Briefcase className="w-5 h-5" />
                      ) : isInt ? (
                        <Mic className="w-5 h-5" />
                      ) : (
                        <Code2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                          {item.company}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-0.5 block">{item.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.score !== undefined && (
                      <span className="text-xs font-bold font-mono text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        {item.score} pts
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
