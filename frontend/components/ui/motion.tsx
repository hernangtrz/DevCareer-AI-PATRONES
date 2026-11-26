"use client";

import React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import {
  MOTION_DURATION,
  MOTION_EASE,
  resolveMotionTransition,
} from "@/lib/motion-tokens";

export * from "@/lib/motion-tokens";

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  y?: number;
  children: React.ReactNode;
}

/**
 * Entrada suave con opacidad y desplazamiento vertical en el compositor,
 * respetando automáticamente `prefers-reduced-motion`.
 */
export function FadeIn({
  delay = 0,
  duration = MOTION_DURATION.normal,
  y = 10,
  children,
  ...props
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={resolveMotionTransition(prefersReducedMotion, {
        duration,
        delay,
        ease: MOTION_EASE.snappy,
      })}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface ShakeContainerProps {
  triggerKey: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Sacudida horizontal corta para retroalimentación de error en formularios,
 * desactivada si el usuario prefiere movimiento reducido.
 */
export function ShakeOnError({
  triggerKey,
  children,
  className,
}: ShakeContainerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      key={triggerKey}
      animate={
        !prefersReducedMotion && triggerKey > 0
          ? { x: [0, -8, 8, -5, 5, -2, 2, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
