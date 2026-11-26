/*
 * From Uiverse.io by SelfMadeSystem - https://uiverse.io/SelfMadeSystem/weak-mole-88
 * MIT License, Copyright (c) SelfMadeSystem (SelfMadeSystem)
 */

"use client";

import React, { useId } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./NewInterviewGlowButton.module.css";

interface NewInterviewGlowButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export default function NewInterviewGlowButton({
  href = "/interview",
  label = "Nueva Entrevista",
  onClick,
}: NewInterviewGlowButtonProps) {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const unopaqId = `unopaq3-${safeId}`;

  return (
    <Link href={href} onClick={onClick} className={styles.wrapper}>
      <svg aria-hidden="true" className={styles.svgFilters}>
        <filter width="200%" x="-50%" height="200%" y="-50%" id={unopaqId}>
          <feColorMatrix
            values="1 0 0 0.15 0
                    0 1 0 0.15 0
                    0 0 1 0.15 0
                    0 0 0 2 0"
          />
        </filter>
      </svg>

      <div className={styles.buttonContainer}>
        <div
          aria-hidden="true"
          className={`${styles.spin} ${styles.spinOuterGlow}`}
        />
        <div className={styles.buttonBorder}>
          <div
            aria-hidden="true"
            className={`${styles.spin} ${styles.spinInside}`}
            style={{ filter: `blur(1.5px) url(#${unopaqId})` }}
          />
          <div className={styles.buttonFace}>
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-200 shrink-0">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <span>{label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
