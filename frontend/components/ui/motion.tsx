"use client";

import React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

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
  duration = 0.35,
  y = 10,
  children,
  ...props
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration, delay, ease: [0.16, 1, 0.3, 1] }
      }
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
