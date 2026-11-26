/*
 * From Uiverse.io by kiranmayee-abbireddy - https://uiverse.io/kiranmayee-abbireddy/average-insect-70
 * MIT License, Copyright (c) kiranmayee-abbireddy (Kiranmayee Abbireddy)
 */
"use client";

import React from "react";
import styles from "./CodeChallengeMidnightHeader.module.css";

interface CodeChallengeMidnightHeaderProps {
  children: React.ReactNode;
  mode?: "all" | "patterns";
  className?: string;
}

export default function CodeChallengeMidnightHeader({
  children,
  mode = "all",
  className = "",
}: CodeChallengeMidnightHeaderProps) {
  return (
    <section
      className={`${styles.midnightHeader}${
        mode === "patterns" ? ` ${styles.patternsMode}` : ""
      }${className ? ` ${className}` : ""}`}
    >
      <div aria-hidden="true" className={styles.skyCanvas}>
        <div className={`${styles.stars} ${styles.stars1}`} />
        <div className={`${styles.stars} ${styles.stars2}`} />
        <div className={`${styles.stars} ${styles.stars3}`} />

        <div className={`${styles.meteor} ${styles.m1}`} />
        <div className={`${styles.meteor} ${styles.m2}`} />
        <div className={`${styles.meteor} ${styles.m3}`} />

        <div className={styles.moon} />
      </div>

      <div className={styles.content}>{children}</div>
    </section>
  );
}
