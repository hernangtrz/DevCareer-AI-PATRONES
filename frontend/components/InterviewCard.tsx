import "dayjs/locale/es";
import dayjs from "dayjs";
import Image from "next/image";
import { getRandomInterviewCover } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
dayjs.locale("es");
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { getFeedbackByInterviewId } from "@/lib/api";
import { getSessionCookie, getLanguageCookie } from "@/lib/api.server";
import StartTemplateButton from "@/components/StartTemplateButton";
import InterviewCardActions from "@/components/InterviewCardActions";
import { Calendar, Star, ArrowRight, FileCheck2, Play } from "lucide-react";
import "dayjs/locale/en";

function cleanRoleTitle(rawRole: string): string {
  if (!rawRole) return "Software Developer";
  const suffixMatch = rawRole.match(/\((Refuerzo[^)]+)\)$/i);
  const suffix = suffixMatch ? ` ${suffixMatch[0]}` : "";
  let base = suffixMatch
    ? rawRole.slice(0, suffixMatch.index).trim()
    : rawRole.trim();

  base = base
    .replace(
      /^(buscamos\s+(un|una)\s+|estamos\s+en\s+b[úu]squeda\s+de\s+(un|una)\s+|se\s+busca\s+(un|una)?\s*)/i,
      ""
    )
    .replace(/\s+con\s+m[áa]s\s+de\s+\d+.*$/i, "")
    .replace(/\s+con\s+experiencia.*$/i, "")
    .replace(/[.;,:]+$/, "")
    .trim();

  return `${base || rawRole}${suffix}`;
}

const InterviewCard = async ({
  id,
  userId,
  role,
  type,
  techstack,
  createdAt,
  isTemplate = false,
  currentUserId,
}: InterviewCardProps) => {
  const sessionCookie = await getSessionCookie();
  const lang = await getLanguageCookie();
  dayjs.locale(lang);

  const isOwner = !isTemplate && currentUserId && currentUserId === userId;
  const feedback =
    isOwner && userId && id
      ? await getFeedbackByInterviewId({ interviewId: id }, sessionCookie)
      : null;

  const typeTranslations: Record<string, Record<string, string>> = {
    es: {
      Technical: "Técnica",
      Behavioral: "Conductual",
      Mixed: "Mixta",
      tecnica: "Técnica",
      conductual: "Conductual",
      combinada: "Combinada",
    },
    en: {
      Technical: "Technical",
      Behavioral: "Behavioral",
      Mixed: "Mixed",
      tecnica: "Technical",
      conductual: "Behavioral",
      combinada: "Mixed",
    },
  };
  const normalizedType = typeTranslations[lang]?.[type] || type;

  const rawDate = feedback?.createdAt || createdAt;
  const formattedDate = rawDate
    ? lang === "es"
      ? dayjs(rawDate).format("D [de] MMM, YYYY")
      : dayjs(rawDate).format("MMM D, YYYY")
    : lang === "es"
    ? "Reciente"
    : "Recent";

  const hasScore = typeof feedback?.totalScore === "number";
  const displayRole = cleanRoleTitle(role);
  const fullTitle =
    lang === "es" ? `Entrevista de ${displayRole}` : `${displayRole} Interview`;

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96 text-left group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10">
      <div className="card-interview">
        <div>
          <div className="absolute top-0 right-0 w-fit px-4 py-1.5 rounded-bl-xl bg-light-600/90 backdrop-blur-sm border-b border-l border-white/10">
            <p className="badge-text text-xs tracking-wide">{normalizedType}</p>
          </div>
          <div className="flex items-end justify-between gap-4 pt-1">
            <Image
              src={getRandomInterviewCover()}
              alt="cover image"
              width={76}
              height={76}
              className="rounded-full object-cover size-[76px] shrink-0 transition-transform duration-300 group-hover:scale-105"
            />
            {isOwner && (
              <div className="z-10">
                <InterviewCardActions
                  interviewId={id!}
                  initialRole={role}
                  initialTechstack={techstack || []}
                />
              </div>
            )}
          </div>
          <h3
            title={fullTitle}
            className="mt-5 capitalize text-xl font-bold tracking-tight text-white group-hover:text-primary-100 transition-colors line-clamp-2"
          >
            {fullTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-light-100/80">
            {!isTemplate && (
              <div className="flex items-center gap-1.5">
                <Calendar
                  className="h-3.5 w-3.5 text-primary-200 shrink-0"
                  aria-hidden="true"
                />
                <span>{formattedDate}</span>
              </div>
            )}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold tabular-nums border ${
                hasScore
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-white/5 border-white/10 text-light-100/70"
              }`}
            >
              <Star
                className={`h-3.5 w-3.5 shrink-0 ${
                  hasScore
                    ? "text-emerald-400 fill-emerald-400/30"
                    : "text-primary-200"
                }`}
                aria-hidden="true"
              />
              <span>{feedback?.totalScore ?? "---"}/100</span>
            </div>
          </div>
          <p className="line-clamp-2 mt-4 text-sm text-light-100/75 leading-relaxed">
            {feedback?.finalAssessment ||
              (lang === "es"
                ? "Aún no has realizado la entrevista. Practica ahora con el agente de voz IA para recibir tu diagnóstico."
                : "You haven't taken this interview yet. Practice now with our AI voice agent.")}
          </p>
        </div>
        <div className="flex flex-row justify-between items-center w-full gap-4 pt-3 border-t border-white/5">
          <DisplayTechIcons techStack={techstack} />
          {isTemplate ? (
            <StartTemplateButton
              templateId={id!}
              userId={currentUserId || ""}
            />
          ) : (
            <Button
              asChild
              className="btn-primary transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link
                href={
                  feedback
                    ? `/interview/${id}/feedback`
                    : `/interview/${id}`
                }
                className="inline-flex items-center gap-1.5"
              >
                {feedback ? (
                  <>
                    <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {lang === "es" ? "Ver diagnóstico" : "View feedback"}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {lang === "es" ? "Practicar" : "Take interview"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </>
                )}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default InterviewCard;
