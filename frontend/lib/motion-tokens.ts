import type { Transition, Variants } from "framer-motion";

/**
 * Sistema centralizado de Animation Tokens y Variants para DevCareer AI.
 * Evita hardcodear curvas de aceleración, resortes o duraciones en componentes.
 */

export const MOTION_EASE = {
  /** Curva institucional suave para entradas de tarjetas, gráficos y paneles */
  smooth: [0.22, 1, 0.36, 1] as const,
  /** Curva rápida de salida / aparición ligera */
  snappy: [0.16, 1, 0.3, 1] as const,
  /** Curva simétrica para micro-interacciones y retroalimentación */
  standard: [0.4, 0, 0.2, 1] as const,
} as const;

export const MOTION_DURATION = {
  instant: 0,
  fast: 0.2,
  normal: 0.35,
  medium: 0.5,
  chart: 0.85,
  slow: 1.0,
} as const;

export const MOTION_SPRING = {
  /** Píldoras activas, tabs y micro-controles */
  snappy: { type: "spring", stiffness: 420, damping: 32 } as const satisfies Transition,
  /** Tarjetas interactivas, hover táctil y scrubbed tooltips */
  gentle: { type: "spring", stiffness: 260, damping: 24, mass: 0.6 } as const satisfies Transition,
  /** Escenarios scroll-driven (Tile Reveal, parallax) */
  scroll: { stiffness: 115, damping: 26, mass: 0.35 } as const,
} as const;

export const MOTION_TRANSITION = {
  smooth: {
    duration: MOTION_DURATION.normal,
    ease: MOTION_EASE.smooth,
  } satisfies Transition,
  panel: {
    duration: MOTION_DURATION.medium,
    ease: MOTION_EASE.smooth,
  } satisfies Transition,
  chart: {
    duration: MOTION_DURATION.chart,
    ease: MOTION_EASE.smooth,
  } satisfies Transition,
  reduced: {
    duration: MOTION_DURATION.instant,
  } satisfies Transition,
} as const;

export const MOTION_VARIANTS = {
  fadeInUp: {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: MOTION_TRANSITION.smooth,
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard },
    },
  } satisfies Variants,

  panelReveal: {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: MOTION_TRANSITION.panel,
    },
  } satisfies Variants,

  scalePop: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: MOTION_SPRING.gentle,
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard },
    },
  } satisfies Variants,

  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
  } satisfies Variants,

  staggerItem: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: MOTION_TRANSITION.smooth,
    },
  } satisfies Variants,
} as const;

/**
 * Devuelve una transición segura respetando `prefers-reduced-motion`.
 */
export function resolveMotionTransition(
  reducedMotion: boolean | null | undefined,
  transition: Transition = MOTION_TRANSITION.smooth
): Transition {
  return reducedMotion ? MOTION_TRANSITION.reduced : transition;
}
