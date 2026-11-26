/*
 * From Uiverse.io by dexter-st - https://uiverse.io/dexter-st/bright-lizard-8
 * MIT License, Copyright (c) dexter-st
 */
"use client";

import React from "react";
import styles from "./AiGeneratingOverlay.module.css";

interface AiGeneratingOverlayProps {
  visible: boolean;
  word?: string;
  title?: string;
  subtitle?: string;
}

export default function AiGeneratingOverlay({
  visible,
  word = "Generating",
  title = "Optimizando con Inteligencia Artificial",
  subtitle = "Refinando redacción, impacto y palabras clave para tu perfil...",
}: AiGeneratingOverlayProps) {
  if (!visible) return null;

  const letters = Array.from(word);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="no-print fixed inset-0 z-[100000] flex flex-col items-center justify-center gap-6 bg-[#020408]/82 backdrop-blur-md px-6"
    >
      <div className={styles.loaderWrapper} aria-hidden="true">
        {letters.map((char, idx) => (
          <span
            key={`${char}-${idx}`}
            className={styles.loaderLetter}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
        <div className={styles.loaderOrb} />
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center max-w-md">
        <p className="text-sm sm:text-base font-bold text-white tracking-tight">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
