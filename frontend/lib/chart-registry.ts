/**
 * Recharts Component Registry & Design Tokens para DevCareer AI.
 * Centraliza la paleta oscura institucional, gradientes SVG, animaciones de gráficos
 * y estilos de ejes/grid/tooltips para evitar duplicación entre dashboards.
 */

export const CHART_COLORS = {
  indigo: "#6366f1",
  indigoLight: "#818cf8",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  lavender: "#cac5fe",
  cyan: "#22d3ee",
  emerald: "#10b981",
  emeraldLight: "#34d399",
  amber: "#f59e0b",
  rose: "#f43f5e",
  gridStroke: "rgba(255, 255, 255, 0.08)",
  polarGridStroke: "rgba(255, 255, 255, 0.12)",
  axisTick: "#a1a1aa",
  axisMuted: "#71717a",
  surface: "#11131c",
  tooltipBg: "#0b0d17",
} as const;

export interface ChartGradientStop {
  offset: string;
  color: string;
  opacity?: number;
}

export interface ChartGradientDef {
  id: string;
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  stops: readonly ChartGradientStop[];
}

export const CHART_GRADIENTS = {
  primaryBar: {
    id: "dcPrimaryBarGrad",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1",
    stops: [
      { offset: "0%", color: CHART_COLORS.indigoLight, opacity: 1 },
      { offset: "100%", color: CHART_COLORS.violet, opacity: 0.85 },
    ],
  },
  successBar: {
    id: "dcSuccessBarGrad",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1",
    stops: [
      { offset: "0%", color: CHART_COLORS.emeraldLight, opacity: 1 },
      { offset: "100%", color: CHART_COLORS.emerald, opacity: 0.85 },
    ],
  },
  radarFill: {
    id: "dcRadarFillGrad",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1",
    stops: [
      { offset: "0%", color: CHART_COLORS.indigo, opacity: 0.48 },
      { offset: "100%", color: CHART_COLORS.purple, opacity: 0.24 },
    ],
  },
  areaEvolution: {
    id: "dcAreaEvolutionGrad",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1",
    stops: [
      { offset: "0%", color: CHART_COLORS.violet, opacity: 0.35 },
      { offset: "100%", color: CHART_COLORS.indigo, opacity: 0.02 },
    ],
  },
} as const satisfies Record<string, ChartGradientDef>;

export const CHART_ANIMATION = {
  barDuration: 850,
  radarDuration: 900,
  pieDuration: 900,
  lineDuration: 950,
  easing: "ease-out" as const,
} as const;

export const CHART_UI_CLASSES = {
  tooltipCard:
    "px-3.5 py-2.5 rounded-xl bg-[#0b0d17]/95 border border-indigo-500/35 shadow-2xl shadow-black/60 backdrop-blur-md text-xs",
  cardContainer:
    "p-6 rounded-3xl bg-[#11131c] border border-zinc-800/90 flex flex-col gap-5 shadow-xl",
} as const;

export interface RegisteredChartMeta {
  id:
    | "weekly-bar"
    | "skills-radar"
    | "evolution-spline"
    | "challenges-donut"
    | "mastery-matrix"
    | "practice-heatmap"
    | "applications-funnel";
  title: string;
  library: "recharts" | "motion-svg";
  benchmark?: number;
}

export const ANALYTICS_CHART_REGISTRY: readonly RegisteredChartMeta[] = [
  { id: "weekly-bar", title: "Puntaje Obtenido por Día", library: "recharts", benchmark: 75 },
  { id: "skills-radar", title: "Radar de Habilidades Técnicas", library: "recharts", benchmark: 80 },
  { id: "evolution-spline", title: "Curva de Evolución Histórica", library: "motion-svg" },
  { id: "challenges-donut", title: "Distribución de Retos por Dificultad", library: "recharts" },
  { id: "mastery-matrix", title: "Matriz de Dominio Técnico", library: "recharts", benchmark: 80 },
  { id: "practice-heatmap", title: "Mapa de Calor de Práctica", library: "recharts" },
  { id: "applications-funnel", title: "Embudo de Postulaciones", library: "recharts" },
] as const;

/**
 * Calcula duración de animación Recharts respetando `prefers-reduced-motion`.
 */
export function getChartAnimationDuration(
  prefersReducedMotion: boolean | null | undefined,
  baseDuration: number = CHART_ANIMATION.barDuration
): number {
  return prefersReducedMotion ? 0 : baseDuration;
}
