"use client";

import React, { useState } from "react";
import { Download, FileText, Code2, Table, ChevronDown } from "lucide-react";

export default function DashboardExportActions() {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = (format: "html" | "md" | "excel") => {
    setIsOpen(false);
    const url = `/api/proxy/feedback/user/analytics-export?format=${format}`;
    window.open(url, "_blank");
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-2 transition backdrop-blur-md cursor-pointer shadow-lg shadow-emerald-600/10"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        <span>Exportar Reporte de Métricas</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#14161f] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 px-3 py-1.5">
              Patrón Bridge (Formatos de Salida)
            </p>
            <button
              onClick={() => handleDownload("excel")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white hover:bg-emerald-500/10 hover:text-emerald-300 transition text-left cursor-pointer"
            >
              <Table className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-semibold flex items-center gap-1.5">
                  <span>Libro de Excel (.csv)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">NUEVO</span>
                </p>
                <p className="text-[10px] text-zinc-400">Compatible con Microsoft Excel</p>
              </div>
            </button>
            <button
              onClick={() => handleDownload("html")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white hover:bg-white/10 transition text-left cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-semibold">Documento Web (HTML)</p>
                <p className="text-[10px] text-zinc-400">Diseño completo para navegador</p>
              </div>
            </button>
            <button
              onClick={() => handleDownload("md")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white hover:bg-white/10 transition text-left cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-blue-400" />
              <div>
                <p className="font-semibold">Markdown (.md)</p>
                <p className="text-[10px] text-zinc-400">Estructurado para GitHub / Notion</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
