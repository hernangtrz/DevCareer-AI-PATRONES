"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  Globe,
  FileCode2,
  FileText,
  Loader2,
  Check,
} from "lucide-react";
import { getFreshAuthToken } from "@/lib/cognito";
import { MOTION_TRANSITION, resolveMotionTransition } from "@/lib/motion-tokens";

interface FeedbackExportButtonsProps {
  interviewId: string;
  hasEnglishFeedback?: boolean;
  hasFacialFeedback?: boolean;
}

type ReportType = "interview" | "english" | "nonverbal";
type FormatType = "html" | "md" | "txt";

export default function FeedbackExportButtons({
  interviewId,
  hasEnglishFeedback = false,
  hasFacialFeedback = false,
}: FeedbackExportButtonsProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadedKey, setDownloadedKey] = useState<string | null>(null);

  const handleDownload = async (report: ReportType, format: FormatType) => {
    const key = `${report}-${format}`;
    setDownloading(key);

    try {
      let token = await getFreshAuthToken();
      const buildHeaders = (authToken: string): Record<string, string> =>
        authToken ? { Authorization: `Bearer ${authToken}` } : {};

      const endpoint = `/api/proxy/feedback/${interviewId}/export?report=${report}&format=${format}`;
      let res = await fetch(endpoint, {
        method: "GET",
        headers: buildHeaders(token),
      });

      if (res.status === 401) {
        const refreshed = await getFreshAuthToken(true);
        if (refreshed && refreshed !== token) {
          token = refreshed;
          res = await fetch(endpoint, {
            method: "GET",
            headers: buildHeaders(token),
          });
        }
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Error al exportar (${res.status})`);
      }

      const disposition = res.headers.get("content-disposition");
      let filename = `${report}-report.${format}`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadedKey(key);
      window.setTimeout(() => {
        setDownloadedKey((prev) => (prev === key ? null : prev));
      }, 2500);

      toast.success(`Reporte descargado: ${filename}`);
    } catch (err: unknown) {
      console.error("[ExportReport] Error:", err);
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "No se pudo descargar el reporte."
      );
    } finally {
      setDownloading(null);
    }
  };

  const formatOptions: ReadonlyArray<{
    format: FormatType;
    label: string;
    sublabel: string;
    accent: string;
    icon: React.ReactNode;
  }> = [
    {
      format: "html",
      label: "Web & PDF",
      sublabel: ".html listo para imprimir",
      accent:
        "border-indigo-500/30 bg-indigo-500/[0.08] text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-400/50 hover:text-white",
      icon: <Globe className="w-4 h-4 text-indigo-300" aria-hidden="true" />,
    },
    {
      format: "md",
      label: "Markdown",
      sublabel: ".md para GitHub / Notion",
      accent:
        "border-violet-500/30 bg-violet-500/[0.08] text-violet-200 hover:bg-violet-500/20 hover:border-violet-400/50 hover:text-white",
      icon: <FileCode2 className="w-4 h-4 text-violet-300" aria-hidden="true" />,
    },
    {
      format: "txt",
      label: "Texto Plano",
      sublabel: ".txt sin formato",
      accent:
        "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:text-white",
      icon: <FileText className="w-4 h-4 text-emerald-300" aria-hidden="true" />,
    },
  ];

  const reportRows: Array<{
    report: ReportType;
    title: string;
    description: string;
    accentBar: string;
  }> = [
    {
      report: "interview",
      title: "Reporte General de Desempeño",
      description:
        "Resumen ejecutivo, puntuación global, 5 dimensiones evaluadas, fortalezas y plan de mejora.",
      accentBar: "from-indigo-500 via-violet-400 to-fuchsia-400",
    },
    ...(hasEnglishFeedback
      ? [
          {
            report: "english" as const,
            title: "Evaluación Lingüística CEFR",
            description:
              "Nivel de inglés A1–C2, gramática, vocabulario, fluidez y sugerencias detectadas.",
            accentBar: "from-cyan-400 to-indigo-400",
          },
        ]
      : []),
    ...(hasFacialFeedback
      ? [
          {
            report: "nonverbal" as const,
            title: "Reporte de Lenguaje No Verbal",
            description:
              "Contacto visual, serenidad, gestualidad, postura y momentos clave de la sesión.",
            accentBar: "from-violet-400 to-emerald-400",
          },
        ]
      : []),
  ];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={resolveMotionTransition(prefersReducedMotion, MOTION_TRANSITION.panel)}
      className="relative overflow-hidden w-full rounded-3xl bg-gradient-to-br from-[#0e1120] via-[#090b14] to-[#07080f] border border-indigo-500/20 p-6 md:p-7 shadow-2xl text-left"
    >
      {/* Resplandores sutiles de marca */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-500/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl"
      />

      {/* Encabezado limpio */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 shrink-0">
            <Download className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Exportar Reporte de Desempeño
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Descarga tu diagnóstico completo en el formato que prefieras para guardar o compartir.
            </p>
          </div>
        </div>
      </div>

      {/* Filas de reportes */}
      <div className="relative z-10 flex flex-col gap-3.5 mt-5">
        {reportRows.map((row) => (
          <div
            key={row.report}
            className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-indigo-500/30 transition-colors"
          >
            {/* Acento vertical lateral */}
            <div
              aria-hidden="true"
              className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b ${row.accentBar}`}
            />

            <div className="pl-2.5 flex flex-col gap-1 max-w-xl">
              <span className="font-semibold text-sm sm:text-base text-white">
                {row.title}
              </span>
              <span className="text-xs text-zinc-400 leading-relaxed">
                {row.description}
              </span>
            </div>

            <div className="pl-2.5 lg:pl-0 grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2.5 shrink-0">
              {formatOptions.map((opt) => {
                const key = `${row.report}-${opt.format}`;
                const isLoading = downloading === key;
                const isDone = downloadedKey === key;

                return (
                  <motion.button
                    key={key}
                    type="button"
                    disabled={isLoading || downloading !== null}
                    whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    onClick={() => handleDownload(row.report, opt.format)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border backdrop-blur-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${opt.accent}`}
                  >
                    <span className="shrink-0">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : isDone ? (
                        <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                      ) : (
                        opt.icon
                      )}
                    </span>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        {opt.sublabel}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
