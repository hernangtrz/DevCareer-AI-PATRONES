"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getCognitoIdToken } from "@/lib/cognito";

interface FeedbackExportButtonsProps {
  interviewId: string;
  hasEnglishFeedback?: boolean;
}

type ReportType = "interview" | "english";
type FormatType = "html" | "md" | "txt";

export default function FeedbackExportButtons({
  interviewId,
  hasEnglishFeedback = false,
}: FeedbackExportButtonsProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (report: ReportType, format: FormatType) => {
    const key = `${report}-${format}`;
    setDownloading(key);

    try {
      const token = getCognitoIdToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(
        `/api/proxy/feedback/${interviewId}/export?report=${report}&format=${format}`,
        {
          method: "GET",
          headers,
        }
      );

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

      toast.success(`Reporte descargado: ${filename}`);
    } catch (err: any) {
      console.error("[ExportBridge] Error:", err);
      toast.error(err?.message || "No se pudo descargar el reporte.");
    } finally {
      setDownloading(null);
    }
  };

  const renderDownloadButton = (
    report: ReportType,
    format: FormatType,
    label: string,
    sublabel: string,
    variant: "indigo" | "cyan" | "emerald",
    icon: React.ReactNode
  ) => {
    const key = `${report}-${format}`;
    const isLoading = downloading === key;

    const variantStyles = {
      indigo:
        "border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 text-indigo-200 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/25",
      cyan:
        "border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 text-cyan-200 hover:from-cyan-600 hover:via-blue-600 hover:to-cyan-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/25",
      emerald:
        "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 text-emerald-200 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-emerald-500/25",
    };

    return (
      <button
        key={key}
        type="button"
        disabled={isLoading || downloading !== null}
        onClick={() => handleDownload(report, format)}
        className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium border backdrop-blur-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variantStyles[variant]}`}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-3.5 w-3.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        ) : (
          <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
            {icon}
          </span>
        )}
        <div className="flex flex-col text-left leading-tight">
          <span className="font-semibold">{label}</span>
          <span className="text-[10px] opacity-75 font-normal">{sublabel}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="relative overflow-hidden w-full bg-gradient-to-br from-dark-200 via-dark-300 to-dark-200 border border-light-800 rounded-2xl p-6 md:p-7 shadow-2xl text-left mt-8">
      {/* Resplandor decorativo de fondo */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-primary-200/10 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl"></div>

      {/* Encabezado */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-light-800/80 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary-200/10 border border-primary-200/20 text-primary-200 shadow-inner flex-shrink-0">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Exportar Reporte de Desempeño
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-200/15 text-primary-200 border border-primary-200/30">
                Patrón Bridge GoF
              </span>
            </div>
            <p className="text-xs text-light-400 mt-1">
              Desacopla el tipo de informe (Abstracción) del formato de salida (Implementador) permitiendo evolución independiente.
            </p>
          </div>
        </div>
      </div>

      {/* Bloques de exportación */}
      <div className="relative z-10 flex flex-col gap-4 mt-5">
        {/* Reporte General de la Entrevista */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-dark-100/60 border border-light-800/80 backdrop-blur-sm transition-colors hover:border-light-700/80">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-sm flex-shrink-0">
              📊
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-light-100 flex items-center gap-2">
                Reporte General de Desempeño
              </span>
              <span className="text-xs text-light-400">
                Puntuación 0-100, fortalezas, 5 categorías técnicas y veredicto
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {renderDownloadButton(
              "interview",
              "html",
              "Web & PDF",
              ".html estilizado",
              "indigo",
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            )}
            {renderDownloadButton(
              "interview",
              "md",
              "Markdown",
              ".md para GitHub",
              "cyan",
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {renderDownloadButton(
              "interview",
              "txt",
              "Texto Plano",
              ".txt sin formato",
              "emerald",
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            )}
          </div>
        </div>

        {/* Reporte CEFR de Inglés (si aplica) */}
        {hasEnglishFeedback && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-dark-100/60 border border-light-800/80 backdrop-blur-sm transition-colors hover:border-light-700/80">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-sm flex-shrink-0">
                🇺🇸
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-light-100 flex items-center gap-2">
                  Evaluación Lingüística CEFR
                </span>
                <span className="text-xs text-light-400">
                  Nivel A1-C2, gramática, vocabulario y sugerencias detectadas
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {renderDownloadButton(
                "english",
                "html",
                "Web & PDF",
                ".html estilizado",
                "indigo",
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              )}
              {renderDownloadButton(
                "english",
                "md",
                "Markdown",
                ".md para GitHub",
                "cyan",
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {renderDownloadButton(
                "english",
                "txt",
                "Texto Plano",
                ".txt sin formato",
                "emerald",
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
