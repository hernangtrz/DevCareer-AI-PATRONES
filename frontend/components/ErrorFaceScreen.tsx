/*
 * From Uiverse.io by preet_7613 - https://uiverse.io/preet_7613/new-cougar-63
 * MIT License, Copyright (c) preet_7613 (Preet)
 */
"use client";

import React from "react";
import Link from "next/link";
import { Home, RotateCcw, Sparkles } from "lucide-react";
import styles from "./ErrorFaceScreen.module.css";

interface ErrorFaceScreenProps {
  code?: string;
  badge?: string;
  title?: string;
  description?: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
  fullViewport?: boolean;
}

export default function ErrorFaceScreen({
  code = "500",
  badge = "DevCareer AI · Incidente Detectado",
  title = "Algo salió mal al cargar esta vista",
  description = "No pudimos completar esta operación en este momento. Puedes intentar nuevamente o regresar al panel principal.",
  detail,
  onRetry,
  retryLabel = "Reintentar",
  backHref = "/dashboard",
  backLabel = "Volver al inicio",
  compact = false,
  fullViewport = false,
}: ErrorFaceScreenProps) {
  return (
    <main
      className={`relative w-full flex items-center justify-center px-4 sm:px-6 ${
        fullViewport ? "min-h-screen bg-[#020408] py-12" : compact ? "py-10" : "min-h-[70vh] py-10"
      }`}
    >
      {/* Subtle DevCareer atmospheric backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full opacity-55"
          style={{
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(168, 85, 247, 0.08) 45%, transparent 72%)",
          }}
        />
      </div>

      <section
        role="alert"
        aria-live="polite"
        className={`relative z-10 w-full ${
          compact ? "max-w-lg p-6 sm:p-8" : "max-w-xl p-7 sm:p-10"
        } rounded-3xl bg-[#11131c]/95 border border-indigo-500/25 shadow-[0_24px_70px_-20px_rgba(79,70,229,0.35)] backdrop-blur-xl flex flex-col items-center text-center gap-5`}
      >
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/12 border border-indigo-400/25 text-indigo-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" aria-hidden="true" />
          <span>{badge}</span>
          {code && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 font-mono text-[11px]">
              {code}
            </span>
          )}
        </div>

        {/* Animated SVG Face (Uiverse preet_7613/new-cougar-63) */}
        <div className={styles.faceStage} aria-hidden="true">
          <div className={styles.faceGlow} />
          <svg
            className={`${styles.face}${compact ? ` ${styles.faceCompact}` : ""}`}
            viewBox="0 0 320 380"
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="25"
            >
              <g className={styles.faceEyes} transform="translate(0,112.5)">
                <g transform="translate(15,0)">
                  <polyline
                    className={styles.faceEyeLid}
                    points="37,0 0,120 75,120"
                  />
                  <polyline
                    className={styles.facePupil}
                    points="55,120 55,155"
                    strokeDasharray="35 35"
                  />
                </g>
                <g transform="translate(230,0)">
                  <polyline
                    className={styles.faceEyeLid}
                    points="37,0 0,120 75,120"
                  />
                  <polyline
                    className={styles.facePupil}
                    points="55,120 55,155"
                    strokeDasharray="35 35"
                  />
                </g>
              </g>
              <rect
                className={styles.faceNose}
                x="132.5"
                y="112.5"
                width="55"
                height="155"
                rx="4"
                ry="4"
              />
              <g transform="translate(65,334)" strokeDasharray="102 102">
                <path
                  className={styles.faceMouthLeft}
                  d="M 0 30 C 0 30 40 0 95 0"
                />
                <path
                  className={styles.faceMouthRight}
                  d="M 95 0 C 150 0 190 30 190 30"
                />
              </g>
            </g>
          </svg>
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2 max-w-md">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {description}
          </p>
          {detail && (
            <p className="mt-1 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-indigo-300/80 break-all">
              {detail}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 w-full">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>{retryLabel}</span>
            </button>
          )}

          <Link
            href={backHref}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${
              onRetry
                ? "bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25"
            }`}
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
