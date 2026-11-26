/*
 * From Uiverse.io by ElSombrero2 - https://uiverse.io/ElSombrero2/fresh-wombat-97
 * MIT License, Copyright (c) ElSombrero2 (Rakotondrasoa Nirilala)
 */
"use client";

import React from "react";
import styles from "./AnalyticsMetricCard.module.css";

interface AnalyticsMetricCardProps {
  children: React.ReactNode;
  highlighted?: boolean;
  className?: string;
}

export default function AnalyticsMetricCard({
  children,
  highlighted = false,
  className = "",
}: AnalyticsMetricCardProps) {
  return (
    <div
      className={`${styles.wombatCard}${highlighted ? ` ${styles.highlighted}` : ""}${className ? ` ${className}` : ""}`}
    >
      <div className={styles.content}>{children}</div>
    </div>
  );
}
