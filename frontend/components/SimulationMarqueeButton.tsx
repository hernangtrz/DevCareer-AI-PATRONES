/*
 * From Uiverse.io by doniaskima - https://uiverse.io/doniaskima/happy-moth-17
 * MIT License, Copyright (c) doniaskima (doniaskima)
 */
"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./SimulationMarqueeButton.module.css";

interface SimulationMarqueeButtonProps {
  href: string;
  label?: string;
  className?: string;
}

const MARQUEE_REPEAT_COUNT = 6;

export default function SimulationMarqueeButton({
  href,
  label = "Hacer una Simulación Completa (Voz + Código)",
  className = "",
}: SimulationMarqueeButtonProps) {
  return (
    <Link
      href={href}
      className={`${styles.marqueeButton}${className ? ` ${className}` : ""}`}
    >
      <span className={styles.viewport}>
        <span className={styles.restText}>
          <span>{label}</span>
          <ArrowRight className={styles.icon} aria-hidden="true" />
        </span>

        <span aria-hidden="true" className={styles.marqueeLayer}>
          <span className={styles.marqueeTrack}>
            {Array.from({ length: MARQUEE_REPEAT_COUNT }, (_, idx) => (
              <span key={idx} className={styles.marqueeItem}>
                <span>{label}</span>
                <ArrowRight className={styles.icon} aria-hidden="true" />
              </span>
            ))}
          </span>
        </span>
      </span>
    </Link>
  );
}
