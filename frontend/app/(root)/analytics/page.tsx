"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  Trophy,
  Zap,
  CheckCircle2,
  Layers,
  Mic,
  Code2,
  Globe,
  FileText,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Activity,
  Calendar,
  Clock,
  Briefcase,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  RefreshCw,
  Download,
  ExternalLink,
  PieChart,
  Sparkles,
} from "lucide-react";
import DashboardExportActions from "@/components/DashboardExportActions";

// ── Types ──
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

// ── Fallback default data in case API is loading or network re-validates ──
const DEFAULT_ANALYTICS: AnalyticsData = {
  userId: "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
  readinessScore: 82,
  readinessLevel: "Senior Ready",
  targetDelta: "+4.2 pts este mes",
  metrics: {
    totalInterviews: 6,
    challengesCompleted: 24,
    challengeSuccessRate: 78,
    activeStreakDays: 8,
    practiceHoursMonth: 42,
    totalApplications: 2,
    interviewingApplications: 1,
    offeredApplications: 0,
    rejectedApplications: 0,
  },
  pillars: [
    { name: "Arquitectura & SOLID", score: 88, benchmark: 75, status: "Sobresaliente" },
    { name: "Patrones GoF", score: 92, benchmark: 78, status: "Sobresaliente" },
    { name: "Algoritmos & DS", score: 74, benchmark: 80, status: "En Progreso" },
    { name: "Comunicación Técnica", score: 81, benchmark: 78, status: "Óptimo" },
    { name: "Inglés Profesional", score: 76, benchmark: 75, status: "B2 Confirmado" },
  ],
  weeklyProgress: [
    { day: "Lun", score: 68, target: 70 },
    { day: "Mar", score: 74, target: 70 },
    { day: "Mié", score: 72, target: 70 },
    { day: "Jue", score: 85, target: 75 },
    { day: "Vie", score: 79, target: 75 },
    { day: "Sáb", score: 88, target: 80 },
    { day: "Dom", score: 84, target: 80 },
  ],
  blindspots: [
    {
      id: "bs-1",
      severity: "high",
      title: "Cuantificación de impacto en respuestas de arquitectura",
      detail: "En el 64% de las respuestas técnicas se describe la solución de forma puramente conceptual, omitiendo métricas clave de escala (TPS, latencia p99 y reducción de costos en nube).",
      action: "Estructurar respuestas bajo el framework STAR cuantificando métricas de rendimiento y disponibilidad.",
      category: "Comunicación Técnica",
    },
    {
      id: "bs-2",
      severity: "medium",
      title: "Profundidad en patrones de resiliencia distribuida",
      detail: "Al abordar fallos de red en microservicios se mencionan reintentos estándar, pero se omiten patrones avanzados como Circuit Breaker, Bulkhead y Rate Limiting adaptativo.",
      action: "Repasar la implementación formal de Circuit Breaker y mecanismos de degradación controlada.",
      category: "Patrones & Arquitectura",
    },
    {
      id: "bs-3",
      severity: "low",
      title: "Discusión formal de concurrencia y aislamiento transaccional",
      detail: "Manejo sólido de concurrencia básica, pero se detecta vacilación al contrastar control de concurrencia optimista vs pesimista en bases de datos distribuidas.",
      action: "Revisar algoritmos de aislamiento transaccional (MVCC) y consistencia eventual.",
      category: "Bases de Datos & Sistemas",
    },
  ],
  recentActivity: [
    {
      id: "act-app-0",
      type: "application",
      title: "Postulación: Backend Software Engineer - Application Development",
      company: "Palantir Technologies",
      timestamp: "Hoy, 10:14 h",
      status: "En Entrevista",
    },
    {
      id: "act-app-1",
      type: "application",
      title: "Postulación: Senior Backend Engineer (Go & Ruby)",
      company: "GitLab",
      timestamp: "Ayer, 16:30 h",
      status: "En Espera",
    },
    {
      id: "act-chal-1",
      type: "challenge",
      title: "Reto Técnico: Patrón Adapter & Facade para Agregación",
      company: "Arena GoF",
      timestamp: "Hace 2 días",
      score: 94,
      status: "Aprobado",
    },
    {
      id: "act-int-1",
      type: "interview",
      title: "Simulación de Arquitectura & Microservicios de Alta Concurrencia",
      company: "Evaluador AI",
      timestamp: "Hace 3 días",
      score: 88,
      status: "Completada",
    },
  ],
};

// ── Radar Chart Coordinates Math (5 Axes) ──
const RADAR_AXES_METRICS = [
  { label: "Conocimiento Técnico", angle: -90, score: 75, benchmark: 75 },
  { label: "Comunicación Técnica", angle: -18, score: 75, benchmark: 75 },
  { label: "Resolución de Problemas", angle: 54, score: 75, benchmark: 75 },
  { label: "Ajuste al Puesto", angle: 126, score: 75, benchmark: 75 },
  { label: "Confianza y Claridad", angle: 198, score: 75, benchmark: 75 },
];

function getRadarCoord(angleDeg: number, score: number, cx: number, cy: number, maxR: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const r = (Math.max(10, Math.min(100, score)) / 100) * maxR;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "blindspots" | "activity">("overview");
  const [blindspotFilter, setBlindspotFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");

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
      console.warn("Could not load dynamic analytics, using persistent fallback", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      const now = new Date();
      setLastUpdated(
        now.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = (format: "csv" | "html" | "markdown") => {
    const url = `/api/proxy/feedback/user/analytics-export?format=${format}`;
    window.open(url, "_blank");
  };

  // Radar Polygon Points Calculation
  const cx = 175;
  const cy = 175;
  const maxR = 115;

  const radarAxes = (data.pillars && data.pillars.length === 5)
    ? data.pillars.map((p, i) => ({
        label: p.name,
        angle: -90 + i * 72,
        score: p.score,
        benchmark: p.benchmark,
      }))
    : RADAR_AXES_METRICS;

  const userScores = radarAxes.map((p) => p.score);
  const benchmarkScores = radarAxes.map((p) => p.benchmark);

  const userPolygon = radarAxes.map((axis, i) => {
    const pt = getRadarCoord(axis.angle, userScores[i] ?? 75, cx, cy, maxR);
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }).join(" ");

  const benchmarkPolygon = radarAxes.map((axis, i) => {
    const pt = getRadarCoord(axis.angle, benchmarkScores[i] ?? 75, cx, cy, maxR);
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }).join(" ");

  // Filtered Blindspots
  const filteredBlindspots =
    blindspotFilter === "all"
      ? data.blindspots
      : data.blindspots.filter((b) =>
          b.category.toLowerCase().includes(blindspotFilter.toLowerCase())
        );

  // Filtered Activity
  const filteredActivity =
    activityFilter === "all"
      ? data.recentActivity
      : data.recentActivity.filter((a) => a.type === activityFilter);

  // Weekly average
  const weeklyAvg =
    data.weeklyProgress && data.weeklyProgress.length > 0
      ? (
          data.weeklyProgress.reduce((acc, p) => acc + p.score, 0) /
          data.weeklyProgress.length
        ).toFixed(1)
      : "78.4";

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── Top Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Progreso & Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Benchmark Activo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Métricas de preparación técnica, radar multidimensional de competencias, detección de brechas
            de arquitectura y seguimiento en tiempo real de postulaciones laborales.
          </p>
        </div>

        {/* Action Controls & Bridge Exports */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            title="Sincronizar métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : "text-zinc-400"}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <DashboardExportActions />

          {lastUpdated && (
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono pl-2 border-l border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sinc: {lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Level KPIs Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Employability Index */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#11131c] border border-white/[0.07] flex flex-col justify-between hover:border-indigo-500/30 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Índice de Empleabilidad
            </span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {data.readinessScore}
            </span>
            <span className="text-xs text-zinc-400 font-mono">/ 100</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-medium">{data.readinessLevel}</span>
            <span className="text-zinc-400 font-mono">{data.targetDelta}</span>
          </div>
        </div>

        {/* Card 2: Interviews Conducted */}
        <div className="p-4 rounded-2xl bg-[#11131c] border border-white/[0.07] flex flex-col justify-between hover:border-zinc-700 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Entrevistas de Voz
            </span>
            <Mic className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {data.metrics.totalInterviews}
            </span>
            <span className="text-xs text-zinc-400">sesiones</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Audio & feedback registrados</span>
          </div>
        </div>

        {/* Card 3: Code Challenges */}
        <div className="p-4 rounded-2xl bg-[#11131c] border border-white/[0.07] flex flex-col justify-between hover:border-zinc-700 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Retos & Patrones GoF
            </span>
            <Code2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {data.metrics.challengesCompleted}
            </span>
            <span className="text-xs text-zinc-400">resueltos</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <span className="font-mono text-purple-400 font-semibold">{data.metrics.challengeSuccessRate}%</span>
            <span>tasa de acierto global</span>
          </div>
        </div>

        {/* Card 4: Practice Streak */}
        <div className="p-4 rounded-2xl bg-[#11131c] border border-white/[0.07] flex flex-col justify-between hover:border-zinc-700 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Racha de Estudio
            </span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {data.metrics.activeStreakDays}
            </span>
            <span className="text-xs text-zinc-400">días seguidos</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="font-mono">{data.metrics.practiceHoursMonth}h</span>
            <span>acumuladas este mes</span>
          </div>
        </div>

        {/* Card 5: Tracked Job Applications */}
        <div className="p-4 rounded-2xl bg-[#11131c] border border-white/[0.07] flex flex-col justify-between hover:border-zinc-700 transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Postulaciones
            </span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {data.metrics.totalApplications}
            </span>
            <span className="text-xs text-zinc-400">registradas</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{data.metrics.interviewingApplications} en entrevista</span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/70 border border-zinc-800/80 w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Vista General & Gráficas</span>
        </button>

        <button
          onClick={() => setActiveTab("blindspots")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "blindspots"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Auditoría de Brechas</span>
          <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] font-mono">
            {data.blindspots.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "activity"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Historial de Actividad</span>
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & CHARTS ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Technical Competency Radar (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#11131c] border border-white/[0.07] flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800/70">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    Radar de Competencias Técnicas
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Evaluación vectorial multidimensional comparada contra el perfil Senior esperado.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                    <span>Tu Nivel</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="w-2.5 h-1 border-t border-dashed border-zinc-400" />
                    <span>Senior Benchmark (80)</span>
                  </div>
                </div>
              </div>

              {/* Spider Chart SVG Rendering */}
              <div className="relative py-4 flex items-center justify-center">
                <svg width="350" height="350" viewBox="0 0 350 350" className="overflow-visible select-none">
                  <defs>
                    <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>

                  {/* Concentric Web Rings (20%, 40%, 60%, 80%, 100%) */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, ringIdx) => {
                    const r = maxR * level;
                    const ringPoints = radarAxes.map((axis) => {
                      const rad = ((axis.angle - 90) * Math.PI) / 180;
                      return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`;
                    }).join(" ");

                    return (
                      <g key={ringIdx}>
                        <polygon
                          points={ringPoints}
                          fill="none"
                          stroke={level === 0.8 ? "rgba(148, 163, 184, 0.3)" : "rgba(255, 255, 255, 0.06)"}
                          strokeWidth={level === 0.8 ? "1.5" : "1"}
                          strokeDasharray={level === 0.8 ? "3 3" : undefined}
                        />
                        {/* Percentage label on the vertical top axis */}
                        <text
                          x={cx + 4}
                          y={cy - r + 3}
                          fontSize="9"
                          fill="rgba(148, 163, 184, 0.5)"
                          fontFamily="monospace"
                        >
                          {(level * 100).toFixed(0)}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Radial Axis Lines */}
                  {radarAxes.map((axis, i) => {
                    const rad = ((axis.angle - 90) * Math.PI) / 180;
                    const x2 = cx + maxR * Math.cos(rad);
                    const y2 = cy + maxR * Math.sin(rad);

                    // Label offset positioning
                    const labelR = maxR + 24;
                    const lx = cx + labelR * Math.cos(rad);
                    const ly = cy + labelR * Math.sin(rad);

                    return (
                      <g key={i}>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={x2}
                          y2={y2}
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth="1"
                        />
                        <text
                          x={lx}
                          y={ly}
                          fontSize="10"
                          fontWeight="600"
                          fill="#cbd5e1"
                          textAnchor={lx > cx + 10 ? "start" : lx < cx - 10 ? "end" : "middle"}
                          dominantBaseline="middle"
                        >
                          {axis.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Benchmark Polygon */}
                  <polygon
                    points={benchmarkPolygon}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />

                  {/* User Actual Polygon */}
                  <polygon
                    points={userPolygon}
                    fill="url(#userGrad)"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                  />

                  {/* Vertex Dots with tooltips */}
                  {radarAxes.map((axis, i) => {
                    const pt = getRadarCoord(axis.angle, userScores[i] ?? 75, cx, cy, maxR);
                    return (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#818cf8"
                          stroke="#11131c"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Axis Score Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4 border-t border-zinc-800/70 text-center">
                {data.pillars.map((pillar, i) => (
                  <div key={i} className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                    <p className="text-[10px] text-zinc-400 truncate">{pillar.name}</p>
                    <p className="text-sm font-bold font-mono text-white mt-0.5">
                      {pillar.score}
                      <span className="text-[10px] text-zinc-400 font-normal"> / {pillar.benchmark}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Weekly Progression & Consistency (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#11131c] border border-white/[0.07] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800/70">
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Progreso Semanal
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Consistencia diaria y rendimiento en evaluaciones.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    Promedio: {weeklyAvg} pts
                  </span>
                </div>

                {/* Vertical Bar Chart */}
                <div className="mt-6 space-y-4">
                  <div className="h-48 flex items-end justify-between gap-2.5 pt-6 pb-2 px-1 relative">
                    {/* Target Benchmark Line at 75 pts */}
                    <div className="absolute inset-x-0 bottom-[75%] border-b border-dashed border-zinc-500/40 pointer-events-none flex justify-between items-center">
                      <span className="text-[9px] font-mono text-zinc-400 pl-1 -mt-3.5">
                        Meta Senior (75 pts)
                      </span>
                    </div>

                    {data.weeklyProgress.map((item, idx) => {
                      const heightPercent = Math.min(100, Math.max(15, item.score));
                      const isHigh = item.score >= 80;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                          {/* Score tooltip on hover */}
                          <span className="text-[10px] font-mono font-bold text-zinc-300 mb-1 opacity-80 group-hover:opacity-100 transition">
                            {item.score}
                          </span>
                          <div className="w-full max-w-[32px] bg-zinc-800/80 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-lg transition-all duration-500 ${
                                isHigh
                                  ? "bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300"
                                  : "bg-gradient-to-t from-zinc-700 to-zinc-500 group-hover:from-zinc-600 group-hover:to-zinc-400"
                              }`}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-zinc-400 mt-2">
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Weekly Highlights Footer */}
              <div className="pt-4 border-t border-zinc-800/70 grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-400">Mayor Puntuación</span>
                  <p className="text-sm font-bold text-indigo-400 font-mono mt-0.5">88 pts (Sábado)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-400">Cumplimiento de Meta</span>
                  <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">5 de 7 días</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Pillars Breakdown & Applications Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pillars Detailed Bars (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#11131c] border border-white/[0.07] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/70">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Desglose por Pilares de Competencia
                </h3>
                <span className="text-xs text-zinc-400">Escala de 0 a 100</span>
              </div>

              <div className="space-y-4 pt-1">
                {data.pillars.map((pillar, idx) => {
                  const meetsBenchmark = pillar.score >= pillar.benchmark;

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-200">{pillar.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-white">{pillar.score}%</span>
                          <span className="text-zinc-400 text-[11px]">(Obj: {pillar.benchmark}%)</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              meetsBenchmark
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {pillar.status}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar with Benchmark Notch */}
                      <div className="relative w-full h-2 rounded-full bg-zinc-800/90 overflow-hidden">
                        <div
                          style={{ width: `${pillar.score}%` }}
                          className={`h-full rounded-full transition-all duration-700 ${
                            meetsBenchmark
                              ? "bg-gradient-to-r from-indigo-500 to-emerald-400"
                              : "bg-gradient-to-r from-amber-500 to-indigo-500"
                          }`}
                        />
                        {/* Target Benchmark Notch */}
                        <div
                          style={{ left: `${pillar.benchmark}%` }}
                          className="absolute top-0 bottom-0 w-0.5 bg-white/70 shadow-sm"
                          title={`Meta: ${pillar.benchmark}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Applications Pipeline Funnel (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#11131c] border border-white/[0.07] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/70">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    Pipeline de Postulaciones
                  </h3>
                  <Link
                    href="/jobs?tab=applications"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <span>Ver mis postulaciones</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-xs font-medium text-zinc-300">Postulaciones Activas</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-white">
                      {data.metrics.totalApplications}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-medium text-zinc-300">En Proceso de Entrevista</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {data.metrics.interviewingApplications}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-xs font-medium text-zinc-300">Ofertas / Decisiones</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-white">
                      {data.metrics.offeredApplications}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conversion Stats Banner */}
              <div className="mt-5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Tasa de Conversión a Entrevista</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  {data.metrics.totalApplications > 0
                    ? ((data.metrics.interviewingApplications / data.metrics.totalApplications) * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: AUDIT OF BLINDSPOTS ── */}
      {activeTab === "blindspots" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#11131c] border border-white/[0.07]">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Diagnóstico Técnico de Brechas
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Patrones de respuesta que requieren fortalecimiento antes de entrevistas con paneles técnicos senior.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "Comunicación", "Arquitectura", "Sistemas"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setBlindspotFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    blindspotFilter === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {cat === "all" ? "Todas las Áreas" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Blindspot Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredBlindspots.map((item) => {
              const isHigh = item.severity === "high";
              const isMedium = item.severity === "medium";

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#11131c] border border-white/[0.07] hover:border-zinc-700 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          isHigh
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : isMedium
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        Prioridad {item.severity === "high" ? "Alta" : item.severity === "medium" ? "Media" : "Baja"}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">{item.category}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{item.detail}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/70 flex items-start gap-2 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                    <Target className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                        Acción Prescrita de Ingeniería
                      </span>
                      <p className="text-xs text-zinc-300 mt-0.5">{item.action}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: ACTIVITY LOG ── */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#11131c] border border-white/[0.07]">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Registro Cronológico de Actividad
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Seguimiento integrado de sesiones de entrevista, postulaciones de empleo y retos de patrones resueltos.
              </p>
            </div>

            {/* Filter by Type */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "Todo" },
                { id: "application", label: "Postulaciones" },
                { id: "interview", label: "Entrevistas" },
                { id: "challenge", label: "Retos GoF" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActivityFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activityFilter === f.id
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Timeline List */}
          <div className="rounded-2xl bg-[#11131c] border border-white/[0.07] divide-y divide-zinc-800/70 overflow-hidden">
            {filteredActivity.map((act) => {
              const isApp = act.type === "application";
              const isInterview = act.type === "interview";

              return (
                <div key={act.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl border mt-0.5 ${
                        isApp
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : isInterview
                          ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      }`}
                    >
                      {isApp ? (
                        <Briefcase className="w-4 h-4" />
                      ) : isInterview ? (
                        <Mic className="w-4 h-4" />
                      ) : (
                        <Code2 className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                          {act.company}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs text-zinc-400">{act.timestamp}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-0.5">{act.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {act.score !== undefined && (
                      <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                        {act.score} pts
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        act.status.toLowerCase().includes("entrevista") || act.status.toLowerCase().includes("aprobado")
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {act.status}
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
