export const dynamic = "force-dynamic";

import "dayjs/locale/es";
import "dayjs/locale/en";
import dayjs from "dayjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSessionCookie, getLanguageCookie } from "@/lib/api.server";
import { getFeedbackByInterviewId, getInterviewById } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/translations";
import FeedbackInsightsDashboard from "@/components/FeedbackInsightsDashboard";
import FeedbackPulseStage from "@/components/FeedbackPulseStage";
import FeedbackExportButtons from "@/components/FeedbackExportButtons";
import RetakeInterviewButton from "@/components/RetakeInterviewButton";
import { FacialBehaviorFeedbackCard } from "@/components/FacialBehaviorFeedbackCard";
import backBtnStyles from "@/components/FeedbackBackButton.module.css";

const Page = async ({ params }: RouteParams) => {
  const { id } = await params;
  const sessionCookie = await getSessionCookie();
  const lang = await getLanguageCookie();
  dayjs.locale(lang);
  const t = translations[lang];

  const interview = await getInterviewById(id, sessionCookie);
  if (!interview) redirect("/dashboard");

  const feedback = await getFeedbackByInterviewId({ interviewId: id }, sessionCookie);

  const formattedDate =
    lang === "es"
      ? feedback?.createdAt
        ? dayjs(feedback.createdAt).format("D [de] MMMM, YYYY · h:mm A")
        : "N/A"
      : feedback?.createdAt
      ? dayjs(feedback.createdAt).format("MMMM D, YYYY · h:mm A")
      : "N/A";

  return (
    <section className="section-feedback !gap-6 !max-w-6xl pb-12">
      {/* Escena Interactiva PULSE (física 2D por velocidad de cursor + resorte) */}
      <FeedbackPulseStage
        role={interview.role}
        level={interview.level}
        formattedDate={formattedDate}
        totalScore={feedback?.totalScore ?? 0}
        categoryScores={feedback?.categoryScores ?? []}
        strengthsCount={feedback?.strengths?.length ?? 0}
        lang={lang === "en" ? "en" : "es"}
      />

      {/* Panel Analítico Principal con Radar, Sentimiento, Temas y Fortalezas/Mejoras */}
      <FeedbackInsightsDashboard
        role={interview.role}
        company={interview.company}
        level={interview.level}
        interviewType={interview.type}
        techstack={interview.techstack || []}
        formattedDate={formattedDate}
        totalScore={feedback?.totalScore ?? 0}
        finalAssessment={feedback?.finalAssessment ?? ""}
        categoryScores={feedback?.categoryScores ?? []}
        strengths={feedback?.strengths ?? []}
        areasForImprovement={feedback?.areasForImprovement ?? []}
        lang={lang === "en" ? "en" : "es"}
      />

      {feedback?.englishFeedback && (
        <div className="flex flex-col gap-6 p-6 md:p-7 bg-gradient-to-br from-[#0d101c] via-[#090b14] to-[#07080f] border border-indigo-500/20 rounded-3xl text-left shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              🇺🇸 English Proficiency Evaluation
            </h2>
            <div className="flex items-center gap-2 bg-primary-200 text-dark-100 font-bold px-4 py-1.5 rounded-full text-base shadow-sm w-fit">
              <span className="text-[11px] uppercase font-semibold tracking-wider text-dark-200">
                CEFR:
              </span>
              {feedback.englishFeedback.overallLevel}
            </div>
          </div>

          <p className="text-sm text-zinc-200 italic leading-relaxed p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            &ldquo;{feedback.englishFeedback.overallComment}&rdquo;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              { label: "Grammar", value: feedback.englishFeedback.grammarScore },
              { label: "Vocabulary", value: feedback.englishFeedback.vocabularyScore },
              { label: "Fluency", value: feedback.englishFeedback.fluencyScore },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 flex flex-col gap-1"
              >
                <span className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                  {item.label}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-white tabular-nums">
                    {item.value}
                  </span>
                  <span className="text-zinc-500 text-xs">/100</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-violet-400 to-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {feedback.englishFeedback.grammarErrors &&
            feedback.englishFeedback.grammarErrors.length > 0 && (
              <div className="flex flex-col gap-2.5 text-left">
                <h3 className="text-base font-bold text-rose-300">
                  Grammar Mistakes Identified
                </h3>
                <ul className="list-none flex flex-col gap-2 pl-0">
                  {feedback.englishFeedback.grammarErrors.map((error, idx) => (
                    <li
                      key={idx}
                      className="bg-rose-500/10 border border-rose-500/20 text-zinc-200 px-4 py-2.5 rounded-xl text-sm flex items-start gap-2.5"
                    >
                      <span className="text-rose-400 font-bold">✗</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {feedback.englishFeedback.vocabularySuggestions &&
            feedback.englishFeedback.vocabularySuggestions.length > 0 && (
              <div className="flex flex-col gap-2.5 text-left">
                <h3 className="text-base font-bold text-emerald-300">
                  Vocabulary Suggestions
                </h3>
                <ul className="list-none flex flex-col gap-2 pl-0">
                  {feedback.englishFeedback.vocabularySuggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      className="bg-emerald-500/10 border border-emerald-500/20 text-zinc-200 px-4 py-2.5 rounded-xl text-sm flex items-start gap-2.5"
                    >
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {/* Evaluación de Lenguaje No Verbal y Presencia (Edge AI) */}
      {feedback?.facialFeedback && (
        <FacialBehaviorFeedbackCard facialFeedback={feedback.facialFeedback} />
      )}

      {/* Patrón Bridge: Exportación Multiformato de Reportes */}
      <FeedbackExportButtons
        interviewId={id}
        hasEnglishFeedback={!!feedback?.englishFeedback}
        hasFacialFeedback={!!feedback?.facialFeedback}
      />

      <div className="buttons pt-2">
        <Button asChild className={`btn-secondary flex-1 h-12 rounded-2xl ${backBtnStyles.backButton}`}>
          <Link href="/dashboard" className="flex w-full items-center justify-center" aria-label={t.feed_btn_home}>
            <span className={backBtnStyles.backIcon} aria-hidden="true">
              <ArrowLeft className="w-4 h-4 text-primary-200" aria-hidden="true" />
            </span>
            <span className={backBtnStyles.backTextWrap}>
              <span className={`text-sm font-semibold text-primary-200 text-center ${backBtnStyles.backText}`}>
                {t.feed_btn_home}
              </span>
            </span>
          </Link>
        </Button>
        <RetakeInterviewButton
          href={`/interview/${id}`}
          label={t.feed_btn_retake}
        />
      </div>
    </section>
  );
};
export default Page;
