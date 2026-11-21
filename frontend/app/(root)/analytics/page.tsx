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
  Activity,
  Calendar,
  Clock,
  Briefcase,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  PieChart,
  Award,
  GitPullRequest,
  Check,
} from "lucide-react";
import DashboardExportActions from "@/components/DashboardExportActions";

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

function getRadarCoord(angleDeg: number, score: number, cx: number, cy: number, maxR: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const r = (Math.max(10, Math.min(100, score)) / 100) * maxR;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");

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
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ── Coordenadas Radar (Centrado y Limpio) ──
  const cx = 150;
  const cy = 140;
  const maxR = 90;

  const radarAxes =
    data.pillars && data.pillars.length === 5
      ? data.pillars.map((p, i) => ({
          label: p.name.replace(" en Entrevista", "").replace(" & Fluidez", ""),
          angle: RADAR_AXES_METRICS[i]?.angle ?? -90 + i * 72,
          score: p.score,
          benchmark: p.benchmark,
        }))
      : RADAR_AXES_METRICS;

  const userPolygon = radarAxes
    .map((axis) => {
      const pt = getRadarCoord(axis.angle, axis.score, cx, cy, maxR);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(" ");

  const benchmarkPolygon = radarAxes
    .map((axis) => {
      const pt = getRadarCoord(axis.angle, axis.benchmark, cx, cy, maxR);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(" ");

  // ── Promedio semanal ──
  const weeklyAvg = Math.round(
    data.weeklyProgress.reduce((acc, curr) => acc + curr.score, 0) /
      Math.max(1, data.weeklyProgress.length)
  );

  // ── Coordenadas de la Curva de Evolución Histórica (SVG Bezier) ──
  const trendSvgWidth = 520;
  const trendSvgHeight = 220;
  const trendPadX = 35;
  const trendPadY = 30;
  const trendPlotW = trendSvgWidth - trendPadX * 2;
  const trendPlotH = trendSvgHeight - trendPadY * 2;

  const trendCoords = HISTORICAL_TREND.map((pt, i) => {
    const x = trendPadX + (i / (HISTORICAL_TREND.length - 1)) * trendPlotW;
    // Escala de puntaje: 50 a 100
    const normalizedScore = (Math.max(50, Math.min(100, pt.score)) - 50) / 50;
    const y = trendPadY + (1 - normalizedScore) * trendPlotH;
    return { x, y, ...pt };
  });

  // Generar comando SVG path suave (Smooth Bezier Spline)
  const bezierPath = trendCoords.reduce((path, pt, i, arr) => {
    if (i === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const prev = arr[i - 1];
    const cpX1 = prev.x + (pt.x - prev.x) * 0.5;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (pt.x - prev.x) * 0.5;
    const cpY2 = pt.y;
    return `${path} C ${cpX1.toFixed(1)},${cpY1.toFixed(1)} ${cpX2.toFixed(1)},${cpY2.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");

  const areaClosedPath = `${bezierPath} L ${trendCoords[trendCoords.length - 1].x.toFixed(1)},${(trendSvgHeight - trendPadY).toFixed(1)} L ${trendCoords[0].x.toFixed(1)},${(trendSvgHeight - trendPadY).toFixed(1)} Z`;

  // ── Donut Chart (Desglose de Desafíos por Dificultad) ──
  const donutR = 64;
  const donutCircumference = 2 * Math.PI * donutR; // ~402.12
  const easyRatio = 0.375; // 9 / 24 = 37.5%
  const medRatio = 0.417; // 10 / 24 = 41.7%
  const hardRatio = 0.208; // 5 / 24 = 20.8%

  const easyStroke = easyRatio * donutCircumference;
  const medStroke = medRatio * donutCircumference;
  const hardStroke = hardRatio * donutCircumference;

  const easyOffset = 0;
  const medOffset = -easyStroke;
  const hardOffset = -(easyStroke + medStroke);

  // ── Mapa de Calor GitHub (12 semanas x 7 días) ──
  const heatmapDays = ["L", "M", "X", "J", "V", "S", "D"];
  // Matriz determinista pero variada de 12 semanas (84 celdas)
  const heatmapPattern = [
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
    [3, 3, 2, 3, 3, 2, 3], // Última semana (Racha alta activa)
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16 px-4 sm:px-6">
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
        <div className="p-5 rounded-2xl bg-[#11131c] border border-indigo-500/30 flex flex-col justify-between shadow-lg">
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
            <div
              style={{ width: `${data.readinessScore}%` }}
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
            />
          </div>
        </div>

        {/* Tarjeta 2: Entrevistas por Voz */}
        <div className="p-5 rounded-2xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between">
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
        </div>

        {/* Tarjeta 3: Retos de Código */}
        <div className="p-5 rounded-2xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between">
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
        </div>

        {/* Tarjeta 4: Racha de Estudio */}
        <div className="p-5 rounded-2xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between">
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
        </div>
      </div>

      {/* ── Navegación entre Pestañas ── */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Panel Gráfico Principal</span>
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "activity"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Historial de Prácticas</span>
        </button>
      </div>

      {/* ── VISTA PRINCIPAL: MÚLTIPLES GRÁFICAS VISUALES ── */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {/* ═════════ FILA 1: RENDIMIENTO SEMANAL + RADAR MULTIAXIAL ═════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 1: Tu Progreso Semanal (Barras Lun-Dom) */}
            <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Puntaje Obtenido por Día
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Calificaciones obtenidas esta semana (escala 0 a 100).
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  Promedio: {weeklyAvg} pts
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-56 pt-8 pb-3 px-2 flex items-end justify-between gap-3 relative">
                {/* Línea horizontal de meta: 75 pts */}
                <div className="absolute inset-x-0 bottom-[75%] border-b border-dashed border-zinc-600 pointer-events-none flex justify-between">
                  <span className="text-[10px] text-zinc-400 -mt-4 pl-1 font-mono">
                    Meta esperada (75 pts)
                  </span>
                </div>

                {data.weeklyProgress.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.max(15, item.score));
                  const passed = item.score >= 75;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group"
                    >
                      <span className="text-xs font-bold font-mono text-white mb-1.5">
                        {item.score}
                      </span>
                      <div className="w-full max-w-[42px] bg-zinc-800/90 rounded-t-xl overflow-hidden h-full flex flex-col justify-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            passed
                              ? "bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300"
                              : "bg-gradient-to-t from-indigo-700 to-indigo-500 group-hover:from-indigo-600 group-hover:to-indigo-400"
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-400 mt-2.5">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">Mejor resultado:</span>
                  <span className="font-bold font-mono text-emerald-400">Sábado (88 pts)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">Días sobre la meta:</span>
                  <span className="font-bold font-mono text-white">5 de 7 días</span>
                </div>
              </div>
            </div>

            {/* Gráfica 2: Radar Multiaxial de Habilidades Clave */}
            <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" />
                    Radar de Habilidades Técnicas
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Tus 5 pilares evaluados en relación al estándar de la industria (80 pts).
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Tú
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 border border-dashed border-zinc-400" />
                    Meta
                  </span>
                </div>
              </div>

              {/* Spider Chart SVG */}
              <div className="py-2 flex items-center justify-center">
                <svg
                  width="300"
                  height="280"
                  viewBox="0 0 300 280"
                  className="overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="userGradRadar" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Anillos concéntricos de referencia */}
                  {[0.25, 0.5, 0.75, 1.0].map((level, ringIdx) => {
                    const r = maxR * level;
                    const ringPoints = radarAxes
                      .map((axis) => {
                        const rad = ((axis.angle - 90) * Math.PI) / 180;
                        return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`;
                      })
                      .join(" ");

                    return (
                      <polygon
                        key={ringIdx}
                        points={ringPoints}
                        fill="none"
                        stroke="#27272a"
                        strokeWidth="1"
                        strokeDasharray={level === 0.75 ? "3 3" : undefined}
                      />
                    );
                  })}

                  {/* Líneas de Ejes y Etiquetas */}
                  {radarAxes.map((axis, i) => {
                    const rad = ((axis.angle - 90) * Math.PI) / 180;
                    const x2 = cx + maxR * Math.cos(rad);
                    const y2 = cy + maxR * Math.sin(rad);

                    // Posición de etiqueta
                    const labelR = maxR + 24;
                    const labelX = cx + labelR * Math.cos(rad);
                    const labelY = cy + labelR * Math.sin(rad) + 4;

                    return (
                      <g key={i}>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={x2}
                          y2={y2}
                          stroke="#3f3f46"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          fill="#a1a1aa"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {axis.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Polígono de Benchmark / Meta esperada */}
                  <polygon
                    points={benchmarkPolygon}
                    fill="none"
                    stroke="#71717a"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Polígono de Usuario */}
                  <polygon
                    points={userPolygon}
                    fill="url(#userGradRadar)"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                  />

                  {/* Puntos en Vértices */}
                  {radarAxes.map((axis, i) => {
                    const pt = getRadarCoord(axis.angle, axis.score, cx, cy, maxR);
                    return (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill="#818cf8"
                        stroke="#11131c"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Métricas individuales */}
              <div className="grid grid-cols-5 gap-2 pt-3 border-t border-zinc-800 text-center">
                {radarAxes.map((axis, i) => (
                  <div key={i} className="p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <p className="text-[9px] text-zinc-400 truncate">{axis.label}</p>
                    <p className="text-xs font-bold font-mono text-white mt-0.5">{axis.score}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
                <div className="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+24 pts de ganancia</span>
                </div>
              </div>

              {/* Area & Bezier Curve SVG */}
              <div className="py-2 flex flex-col items-center justify-center">
                <svg
                  viewBox={`0 0 ${trendSvgWidth} ${trendSvgHeight}`}
                  className="w-full h-56 select-none overflow-visible"
                >
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                      <stop offset="70%" stopColor="#818cf8" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="60%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>

                  {/* Líneas horizontales de fondo */}
                  {[60, 70, 80, 90].map((val) => {
                    const norm = (val - 50) / 50;
                    const y = trendPadY + (1 - norm) * trendPlotH;
                    return (
                      <g key={val}>
                        <line
                          x1={trendPadX}
                          y1={y}
                          x2={trendSvgWidth - trendPadX}
                          y2={y}
                          stroke="#27272a"
                          strokeWidth="1"
                          strokeDasharray={val === 80 ? "4 4" : undefined}
                        />
                        <text
                          x={trendPadX - 8}
                          y={y + 3}
                          textAnchor="end"
                          fill="#71717a"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Relleno de Área Suave */}
                  <path d={areaClosedPath} fill="url(#trendGradient)" />

                  {/* Trazo Suave Bezier */}
                  <path
                    d={bezierPath}
                    fill="none"
                    stroke="url(#lineStrokeGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Puntos y Etiquetas */}
                  {trendCoords.map((pt, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="5"
                        fill="#11131c"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="2.5"
                        fill="#ffffff"
                      />
                      {/* Puntaje en la parte superior */}
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {pt.score}
                      </text>
                      {/* Fecha abajo */}
                      <text
                        x={pt.x}
                        y={trendSvgHeight - trendPadY + 18}
                        textAnchor="middle"
                        fill="#a1a1aa"
                        fontSize="9"
                      >
                        {pt.date}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

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

            {/* Gráfica 4: Desglose de Desafíos Técnicos (Donut Chart LeetCode Style SVG) */}
            <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-cyan-400" />
                    Distribución de Retos por Dificultad
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Clasificación de los 24 problemas resueltos y patrones abordados.
                  </p>
                </div>
                <Link
                  href="/code-challenge"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Ver catálogo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Donut SVG y Leyenda */}
              <div className="py-2 flex flex-col sm:flex-row items-center justify-around gap-6">
                <div className="relative flex items-center justify-center">
                  <svg
                    width="170"
                    height="170"
                    viewBox="0 0 170 170"
                    className="select-none overflow-visible"
                  >
                    {/* Anillo de fondo */}
                    <circle
                      cx="85"
                      cy="85"
                      r={donutR}
                      fill="none"
                      stroke="#1e2230"
                      strokeWidth="16"
                    />

                    {/* Segmento Fácil (Esmeralda) */}
                    <circle
                      cx="85"
                      cy="85"
                      r={donutR}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="16"
                      strokeDasharray={`${easyStroke} ${donutCircumference}`}
                      strokeDashoffset={easyOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 85 85)"
                      className="transition-all duration-700"
                    />

                    {/* Segmento Medio (Ámbar) */}
                    <circle
                      cx="85"
                      cy="85"
                      r={donutR}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="16"
                      strokeDasharray={`${medStroke} ${donutCircumference}`}
                      strokeDashoffset={medOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 85 85)"
                      className="transition-all duration-700"
                    />

                    {/* Segmento Difícil & Patrones GoF (Púrpura) */}
                    <circle
                      cx="85"
                      cy="85"
                      r={donutR}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="16"
                      strokeDasharray={`${hardStroke} ${donutCircumference}`}
                      strokeDashoffset={hardOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 85 85)"
                      className="transition-all duration-700"
                    />
                  </svg>

                  {/* Centro del Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white font-mono leading-none">
                      {data.metrics.challengesCompleted}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                      Resueltos
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold font-mono">
                      {data.metrics.challengeSuccessRate}% Éxito
                    </span>
                  </div>
                </div>

                {/* Leyenda Detallada */}
                <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                  <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-6 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">Fácil</span>
                        <span className="text-[10px] text-zinc-400">Algoritmos básicos</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">9 (38%)</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-6 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">Medio</span>
                        <span className="text-[10px] text-zinc-400">Estructuras & Big-O</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">10 (42%)</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-6 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-purple-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">Difícil / GoF</span>
                        <span className="text-[10px] text-zinc-400">Visitor, LRU, Sorter</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-400">5 (20%)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 text-xs flex items-center justify-between text-zinc-400">
                <span>Catálogo expandido con retos de patrones GoF</span>
                <span className="text-white font-mono font-semibold">20 disponibles</span>
              </div>
            </div>
          </div>

          {/* ═════════ FILA 3: MATRIZ DE DOMINIO TÉCNICO + MAPA DE CALOR GITHUB ═════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 5: Matriz de Dominio por Área Técnica (Barras Comparativas) */}
            <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    Matriz de Dominio Técnico
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Nivel de maestría por ramas clave de la ingeniería de software.
                  </p>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Meta: 75-80%</span>
              </div>

              <div className="space-y-4 py-3">
                {TECHNICAL_MASTERY_AREAS.map((area, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200">{area.name}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${area.badgeColor}`}
                        >
                          {area.status}
                        </span>
                        <span className="font-mono font-bold text-white">{area.score}%</span>
                      </div>
                    </div>

                    {/* Barra de progreso con benchmark vertical */}
                    <div className="w-full bg-zinc-800/90 rounded-full h-2.5 relative overflow-hidden">
                      <div
                        style={{ width: `${area.score}%` }}
                        className={`h-full rounded-full bg-gradient-to-r ${area.barColor} transition-all duration-500`}
                      />
                      {/* Línea de benchmark a 75% */}
                      <div
                        style={{ left: `${area.benchmark}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-white/40 pointer-events-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-800 text-xs flex items-center justify-between text-zinc-400">
                <span>Línea clara vertical = Umbral requerido de contratación</span>
                <span className="text-emerald-400 font-semibold font-mono">100% Superado</span>
              </div>
            </div>

            {/* Gráfica 6: Mapa de Calor de Actividad y Constancia (GitHub Heatmap Grid) */}
            <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Mapa de Calor de Práctica (12 Semanas)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Registro de frecuencia de simulaciones y ejercicios resueltos.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
                  <Flame className="w-4 h-4 fill-amber-400/20" />
                  <span>Racha: {data.metrics.activeStreakDays} días</span>
                </div>
              </div>

              {/* Grid 12 semanas x 7 días */}
              <div className="py-3 flex flex-col gap-2 overflow-x-auto">
                <div className="flex items-start gap-1.5 justify-center">
                  <div className="flex flex-col gap-1 text-[9px] text-zinc-500 pr-1 select-none font-mono">
                    <span>L</span>
                    <span>M</span>
                    <span>X</span>
                    <span>J</span>
                    <span>V</span>
                    <span>S</span>
                    <span>D</span>
                  </div>

                  {heatmapPattern.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((level, dIdx) => {
                        let colorClass = "bg-zinc-800/60";
                        if (level === 1) colorClass = "bg-emerald-900/80 border border-emerald-800/40";
                        if (level === 2) colorClass = "bg-emerald-600/90";
                        if (level === 3) colorClass = "bg-emerald-400 shadow-sm shadow-emerald-400/30";

                        return (
                          <div
                            key={dIdx}
                            title={`Semana ${wIdx + 1}, Día ${heatmapDays[dIdx]}: ${
                              level === 0 ? "Sin práctica" : `${level} actividades completadas`
                            }`}
                            className={`w-3.5 h-3.5 rounded-[3px] transition-all cursor-pointer hover:scale-125 ${colorClass}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Leyenda Menos -> Más */}
                <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-400">
                  <span className="font-mono">Total: 48 sesiones registradas</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-zinc-500">Menos</span>
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-zinc-800/60" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/80" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600/90" />
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
                    <span className="text-zinc-300">Más</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">Horas de práctica este mes:</span>
                  <span className="font-bold font-mono text-white">42 hrs</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">Constancia semanal:</span>
                  <span className="font-bold font-mono text-emerald-400">85% activa</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════ FILA 4: EMBUDO DE POSTULACIONES + CONSEJOS COMPLETOS ═════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 7: Embudo Visual de Postulaciones (Application Stepper Funnel) */}
            <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-400" />
                    Embudo de Postulaciones
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Conversión de vacantes desde la postulación hasta la oferta final.
                  </p>
                </div>
                <Link
                  href="/jobs?tab=applications"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>Ver todas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Stepper Funnel Visual */}
              <div className="py-4 space-y-3">
                {/* Paso 1: Postulaciones Enviadas */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold font-mono text-zinc-300">
                      1
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Postulaciones Enviadas</span>
                      <span className="text-[10px] text-zinc-400">Currículum enviado a vacantes activas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-white font-mono">
                      {data.metrics.totalApplications}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">100% inicio</span>
                  </div>
                </div>

                {/* Paso 2: En Entrevista Técnica */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      2
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">En Proceso de Entrevista</span>
                      <span className="text-[10px] text-indigo-300/80">Evaluaciones técnicas y filtros activos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-400 font-mono">
                      {data.metrics.interviewingApplications}
                    </span>
                    <span className="text-[10px] text-indigo-300 block font-mono">
                      {data.metrics.totalApplications > 0
                        ? Math.round(
                            (data.metrics.interviewingApplications / data.metrics.totalApplications) *
                              100
                          )
                        : 0}
                      % avance
                    </span>
                  </div>
                </div>

                {/* Paso 3: Ofertas Laborales Obtenidas */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                      3
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Ofertas Finales Recibidas</span>
                      <span className="text-[10px] text-emerald-300/80">Propuesta económica y técnica lista</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {data.metrics.offeredApplications}
                    </span>
                    <span className="text-[10px] text-emerald-300 block font-mono">
                      {data.metrics.totalApplications > 0
                        ? Math.round(
                            (data.metrics.offeredApplications / data.metrics.totalApplications) * 100
                          )
                        : 0}
                      % éxito final
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Tasa de efectividad hacia entrevista:</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  {data.metrics.totalApplications > 0
                    ? Math.round(
                        (data.metrics.interviewingApplications / data.metrics.totalApplications) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>

            {/* Apartado: ¿En qué enfocarte para mejorar? (TEXTOS COMPLETOS Y SIN CORTES) */}
            <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    ¿En qué enfocarte para mejorar?
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Consejos concretos detectados a partir de tus prácticas recientes.
                  </p>
                </div>
                <Link
                  href="/code-challenge"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Practicar retos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Lista de Consejos con Texto Completo, Títulos Semánticos y Acciones */}
              <div className="space-y-3 py-3">
                {data.blindspots.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors flex flex-col gap-2"
                  >
                    {/* Encabezado del Consejo: Número + Título Semántico + Badge de Categoría */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                          {idx + 1}
                        </div>
                        <h4 className="text-xs font-bold text-white tracking-wide">
                          {item.title}
                        </h4>
                      </div>

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
                      </div>
                    </div>

                    {/* Texto del Consejo: Completo, legible, sin elipsis ni recortes */}
                    <p className="text-xs text-zinc-300 leading-relaxed pl-8 break-words whitespace-normal">
                      {item.detail}
                    </p>

                    {/* Acción Recomendada Directa */}
                    {item.action && (
                      <div className="ml-8 p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-2 text-xs">
                        <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="text-zinc-400 leading-snug">
                          <strong className="text-zinc-200">Acción sugerida:</strong> {item.action}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Botón de Acción Principal */}
              <div className="pt-2">
                <Link
                  href="/jobs"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20"
                >
                  <span>Hacer una Simulación Completa (Voz + Código)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
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
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isApp
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
