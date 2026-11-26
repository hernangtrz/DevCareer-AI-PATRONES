"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import CvCreatorForm from "@/components/CvCreatorForm";
import CvAnalyzerUpload from "@/components/CvAnalyzerUpload";
import AiLoader from "@/components/AiLoader";
import GrainMassBackdrop from "@/components/GrainMassBackdrop";
import CvTabSwitch from "@/components/CvTabSwitch";
import CvHeaderRainPattern from "@/components/CvHeaderRainPattern";

function CvHubContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const urlTab: "creator" | "analyzer" = tabParam === "analyzer" ? "analyzer" : "creator";
  const [manualTab, setManualTab] = useState<{
    param: string | null;
    tab: "creator" | "analyzer";
  } | null>(null);

  const activeTab = manualTab && manualTab.param === tabParam ? manualTab.tab : urlTab;
  const setActiveTab = (tab: "creator" | "analyzer") => {
    setManualTab({ param: tabParam, tab });
  };

  return (
    <div className="relative min-h-screen pb-16 print:min-h-0 print:pb-0 print:bg-white">
      <GrainMassBackdrop mode={activeTab} />

      <div className="relative z-10 flex flex-col gap-6 print:block print:gap-0">
        {/* ─── Header Navigation ─── */}
        <CvHeaderRainPattern mode={activeTab} className="no-print">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al panel
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  CV & ATS Intelligence Hub
                </h1>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                Crea tu perfil profesional optimizado con IA y diagnostica la compatibilidad de tu currículum contra cualquier oferta de empleo.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> ATS Ready
              </span>
            </div>
          </div>

          {/* ─── Tab Switcher ─── */}
          <CvTabSwitch activeTab={activeTab} onChange={setActiveTab} />
        </CvHeaderRainPattern>

      <div className="h-px bg-zinc-800/80 w-full no-print" />

      {/* ─── Tab Content ─── */}
      <div className="w-full">
        {activeTab === "creator" ? (
          <div className="animate-in fade-in duration-300 print:animate-none">
            <CvCreatorForm />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 print:animate-none">
            <CvAnalyzerUpload />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function CvHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] w-full flex items-center justify-center py-12">
          <AiLoader size={0.8} label="Cargando CV Hub..." />
        </div>
      }
    >
      <CvHubContent />
    </Suspense>
  );
}
