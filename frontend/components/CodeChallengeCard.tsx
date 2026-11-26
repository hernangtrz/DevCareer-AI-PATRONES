/*
 * From Uiverse.io by Smit-Prajapati - https://uiverse.io/Smit-Prajapati/spicy-rat-83
 * MIT License, Copyright (c) Smit-Prajapati (Smit Prajapati)
 */
"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Clock } from "lucide-react";
import {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  type Problem,
} from "@/lib/problems";
import styles from "./CodeChallengeCard.module.css";

interface CodeChallengeCardProps {
  problem: Problem;
}

export default function CodeChallengeCard({ problem }: CodeChallengeCardProps) {
  const isPattern = problem.category.includes("Patrones de Diseño");
  const isJobCustom = problem.id.startsWith("job-");

  const variantClass = isJobCustom
    ? styles.variantJob
    : isPattern
    ? styles.variantPattern
    : "";

  const bottomBannerLabel = isJobCustom
    ? "reto de vacante"
    : isPattern
    ? "patrón gof · solid"
    : "resolver reto";

  return (
    <Link
      href={`/code-challenge/${problem.id}`}
      className={`group ${styles.card}${variantClass ? ` ${variantClass}` : ""}`}
    >
      {/* Signature rotating inner border & light trail from spicy-rat-83 */}
      <div aria-hidden="true" className={styles.innerBorder} />
      <span aria-hidden="true" className={styles.trail} />

      <div className={styles.content}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            {isJobCustom && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                <Briefcase className="w-3 h-3" />
                Reto de Oferta Laboral
              </span>
            )}
            <span className="text-white font-semibold text-sm leading-snug group-hover:text-cyan-200 transition-colors">
              {problem.title}
            </span>
          </div>
          <span
            className={`flex-shrink-0 text-xs font-semibold border px-2.5 py-0.5 rounded-full ${
              DIFFICULTY_COLORS[problem.difficulty]
            }`}
          >
            {DIFFICULTY_LABELS[problem.difficulty]}
          </span>
        </div>

        {/* Expanding accent reveal rule */}
        <div aria-hidden="true" className={styles.revealRule} />

        {/* Description preview */}
        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
          {problem.description.replace(/`/g, "").split("\n")[0]}
        </p>

        {/* Tags + time */}
        <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
          {problem.category.map((cat) => (
            <span
              key={cat}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                cat === "Patrones de Diseño"
                  ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold"
                  : "bg-zinc-800/60 border border-zinc-700/50 text-zinc-400"
              }`}
            >
              {cat}
            </span>
          ))}
          <span className="flex items-center gap-1 ml-auto text-zinc-500 text-[10px] font-mono">
            <Clock className="w-3 h-3" />
            {problem.timeLimit}m
          </span>
        </div>

        {/* Arrow row */}
        <div className="flex items-center justify-end border-t border-zinc-800/60 pt-3 mt-1">
          <span className="text-xs text-zinc-400 group-hover:text-cyan-300 transition-colors mr-2">
            Resolver reto
          </span>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Bottom border tracking-in caption */}
      <span aria-hidden="true" className={styles.bottomText}>
        {bottomBannerLabel}
      </span>
    </Link>
  );
}
