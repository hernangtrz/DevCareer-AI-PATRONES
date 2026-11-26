/*
 * From Uiverse.io by marsella_3472 - https://uiverse.io/marsella_3472/clever-puma-91
 * MIT License, Copyright (c) SelfMadeSystem (SelfMadeSystem), marsella_3472 (Marsella Mars)
 */
"use client";

import React from "react";
import styles from "./CvHeaderRainPattern.module.css";

interface CvHeaderRainPatternProps {
  children: React.ReactNode;
  mode?: "creator" | "analyzer";
  className?: string;
}

export default function CvHeaderRainPattern({
  children,
  mode = "creator",
  className = "",
}: CvHeaderRainPatternProps) {
  return (
    <div
      className={`${styles.headerSurface}${mode === "analyzer" ? ` ${styles.analyzerMode}` : ""}${className ? ` ${className}` : ""}`}
    >
      <div aria-hidden="true" className={styles.patternViewport}>
        <div className={styles.patternLayer} />
        <div className={styles.readabilityScrim} />
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
