"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Code2,
  DollarSign,
  ExternalLink,
  FileText,
  MapPin,
  Mic,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";
import {
  MOTION_SPRING,
  MOTION_TRANSITION,
  resolveMotionTransition,
} from "@/lib/motion-tokens";

export interface MinimalJobOfferItem {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  logoGradient: string;
  platform: string;
  location: string;
  seniority: string;
  salaryMonthlyUSD: string;
  postedAgo: string;
  matchScore: number;
  matchLevel: "Excelente" | "Alto" | "Bueno" | string;
  matchedSkills: string[];
  missingSkills: string[];
  externalUrl: string;
}

interface JobOfferMinimalCardProps {
  job: MinimalJobOfferItem;
  isSaved: boolean;
  isApplied: boolean;
  isApplying: boolean;
  isSimulating: boolean;
  onOpenPracticeModal: () => void;
  onStartVoiceInterview: () => void;
  onStartCodeChallenge: () => void;
  onToggleSave: () => void;
  onOpenMaterials: () => void;
  onOpenTracking: () => void;
  onDirectApply: () => void;
}

function formatAffinityLabel(level: string): string {
  switch (level) {
    case "Excelente":
      return "Excelente afinidad";
    case "Alto":
      return "Alta afinidad";
    case "Bueno":
      return "Buena afinidad";
    default:
      return `${level} afinidad`;
  }
}

export default function JobOfferMinimalCard({
  job,
  isSaved,
  isApplied,
  isApplying,
  isSimulating,
  onOpenPracticeModal,
  onStartVoiceInterview,
  onStartCodeChallenge,
  onToggleSave,
  onOpenMaterials,
  onOpenTracking,
  onDirectApply,
}: JobOfferMinimalCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const clampedScore = Math.max(0, Math.min(100, Math.round(job.matchScore)));

  const matchAccent =
    clampedScore >= 80
      ? {
          text: "text-emerald-300",
          sub: "text-emerald-300/65",
          bar: "from-emerald-400 to-teal-300",
        }
      : clampedScore >= 60
      ? {
          text: "text-emerald-400",
          sub: "text-zinc-400",
          bar: "from-emerald-400 to-cyan-400",
        }
      : {
          text: "text-amber-300",
          sub: "text-zinc-400",
          bar: "from-amber-400 to-orange-400",
        };

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={resolveMotionTransition(prefersReducedMotion, MOTION_SPRING.gentle)}
      className={`group relative overflow-hidden rounded-[26px] backdrop-blur-2xl transition-colors duration-300 ${
        isApplied
          ? "bg-[#0c1415]/78 border border-emerald-400/25 shadow-[0_20px_50px_-28px_rgba(16,185,129,0.35)]"
          : "bg-[#0c0f17]/74 hover:bg-[#101420]/84 border border-white/[0.08] hover:border-white/[0.16] shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)]"
      }`}
    >
      {/* Apple-style hairline specular highlight along the top edge */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent ${
          isApplied ? "via-emerald-300/35" : "via-white/20"
        } to-transparent`}
      />

      <div className="p-6 md:p-7 flex flex-col gap-5">
        {/* ── 1. Header: Identity + Title + Match Gauge ── */}
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            {/* Squircle company mark */}
            <div
              className={`w-12 h-12 rounded-[15px] bg-gradient-to-br ${job.logoGradient} flex items-center justify-center text-white font-semibold text-sm tracking-tight shadow-lg ring-1 ring-inset ring-white/20 shrink-0`}
            >
              {job.companyInitials}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              {/* Quiet metadata eyebrow */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200">{job.company}</span>
                <span className="text-zinc-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-zinc-400">{job.platform}</span>
                <span className="text-zinc-600" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {job.postedAgo}
                </span>

                {isApplied && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/25 text-[11px] font-medium">
                    <Check className="w-3 h-3" aria-hidden="true" />
                    Postulado
                  </span>
                )}
              </div>

              {/* Clean Apple display title */}
              <h3 className="text-[17px] md:text-[18px] font-semibold tracking-[-0.018em] text-white group-hover:text-indigo-200 transition-colors leading-snug">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Right: Crisp Tabular Match Score + Hairline Progress Bar */}
          <div className="flex flex-col items-end shrink-0 pl-2">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl font-semibold tracking-tight tabular-nums ${matchAccent.text}`}
              >
                {clampedScore}%
              </span>
              <span className="text-[11px] font-medium text-zinc-400">Match</span>
            </div>
            <span className={`text-[11px] font-medium ${matchAccent.sub}`}>
              {formatAffinityLabel(job.matchLevel)}
            </span>
            <div className="mt-1.5 w-20 h-[3px] rounded-full bg-white/[0.08] overflow-hidden">
              <motion.div
                initial={prefersReducedMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={resolveMotionTransition(
                  prefersReducedMotion,
                  MOTION_TRANSITION.panel
                )}
                style={{ width: `${clampedScore}%`, transformOrigin: "left" }}
                className={`h-full rounded-full bg-gradient-to-r ${matchAccent.bar}`}
              />
            </div>
          </div>
        </div>

        {/* ── 2. Calm Metadata Row (Compensation · Location · Seniority) ── */}
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-[13px] text-zinc-400">
          <span className="inline-flex items-center gap-1.5 text-zinc-100 font-medium tabular-nums">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400/90" aria-hidden="true" />
            {job.salaryMonthlyUSD}
          </span>
          <span className="text-zinc-700 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
            <span className="truncate">{job.location}</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 ring-1 ring-inset ring-white/[0.08] text-[11px] font-medium">
            {job.seniority}
          </span>
        </div>

        {/* ── 3. Whisper-Quiet Tech Stack Pills ── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {job.matchedSkills.map((sk) => (
            <span
              key={sk}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/[0.09] text-emerald-300/95 ring-1 ring-inset ring-emerald-400/20 text-[11px] font-medium"
            >
              <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              {sk}
            </span>
          ))}
          {job.missingSkills.map((sk) => (
            <span
              key={sk}
              className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/[0.035] text-zinc-400 ring-1 ring-inset ring-white/[0.06] text-[11px] font-medium"
            >
              {sk}
            </span>
          ))}
        </div>

        {/* ── 4. Balanced Apple Minimal Action Bar (Zero Ugly Wrapping) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.07]">
          {/* Left: Unified Frosted Segmented Preparation Control */}
          <div className="inline-flex items-center p-1 rounded-full bg-white/[0.035] ring-1 ring-inset ring-white/[0.08] gap-0.5">
            <button
              type="button"
              onClick={onOpenPracticeModal}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-indigo-500/25 text-zinc-100 hover:text-white text-xs font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
              title="Elegir entre entrevista de voz, reto de código o ambos"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
              <span>{isSimulating ? "Preparando..." : "Preparar prueba"}</span>
            </button>

            <span className="h-4 w-px bg-white/[0.08] mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={onStartVoiceInterview}
              disabled={isSimulating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.07] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
              title="Iniciar directamente entrevista simulada por voz"
            >
              <Mic
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSimulating ? "animate-spin text-indigo-300" : ""
                }`}
                aria-hidden="true"
              />
              <span>Voz</span>
            </button>

            <button
              type="button"
              onClick={onStartCodeChallenge}
              disabled={isSimulating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.07] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
              title="Iniciar directamente reto técnico de código en vivo"
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Código</span>
            </button>
          </div>

          {/* Right: Bookmark + Single-Line Apply / Applied Cluster */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={onToggleSave}
              aria-label={isSaved ? "Quitar de favoritos" : "Guardar oferta"}
              aria-pressed={isSaved}
              className={`w-9 h-9 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isSaved
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-400/35"
                  : "bg-white/[0.04] hover:bg-white/[0.09] text-zinc-400 hover:text-white ring-1 ring-inset ring-white/[0.08]"
              }`}
              title={isSaved ? "Guardada en favoritos" : "Guardar oferta"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-300/30" : ""}`} />
            </button>

            {isApplied ? (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={onOpenMaterials}
                  disabled={isApplying}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 ring-1 ring-inset ring-indigo-400/30 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  title="Ver carta de motivación y CV adaptado generados"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Cargando...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Carta y CV</span>
                    </>
                  )}
                </button>

                <a
                  href={job.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.09] text-zinc-200 ring-1 ring-inset ring-white/[0.09] text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                  title="Abrir el formulario oficial nuevamente"
                >
                  <span>Formulario</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={onOpenTracking}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 ring-1 ring-inset ring-emerald-400/30 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Seguimiento</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onDirectApply}
                disabled={isApplying}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#04140e] text-xs font-semibold whitespace-nowrap shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)] transition-all cursor-pointer disabled:opacity-50 shrink-0"
                title="Generar carta de motivación, CV adaptado y registrar postulación"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Preparando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Postularme</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
