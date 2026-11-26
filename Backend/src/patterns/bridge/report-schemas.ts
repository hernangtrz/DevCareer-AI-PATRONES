import { z } from "zod";

/**
 * Contratos de Validación Zod para Reportes Multi-Formato (Patrón Bridge).
 * Resiliente a valores `null` / `undefined` provenientes de PostgreSQL (Supabase)
 * y DynamoDB, asegurando integridad estructural de títulos, fechas, métricas
 * y puntajes (0..max) antes de renderizar (HTML, MD, TXT, Excel).
 */

const SafeOptionalString = z
  .unknown()
  .transform((val): string | undefined => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

const SafeDefaultString = (fallback: string) =>
  z.unknown().transform((val): string => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.length > 0) return trimmed;
    }
    return fallback;
  });

const SafeStringList = z.unknown().transform((val): string[] => {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
});

const ClampedPercentage = z.coerce
  .number()
  .finite()
  .catch(0)
  .transform((n) => Math.max(0, Math.min(100, Math.round(n))));

export const KeyValueItemSchema = z.object({
  key: SafeDefaultString("Dato"),
  value: z.unknown().transform((v) => String(v ?? "").trim()),
});

export const ScoreMetricItemSchema = z.object({
  label: SafeDefaultString("Dimensión"),
  score: z.coerce.number().finite().catch(0),
  max: z.coerce.number().positive().catch(100),
  comment: SafeOptionalString,
});

export const ExecutiveHighlightSchema = z.object({
  score: z.coerce.number().finite().catch(0),
  max: z.coerce.number().positive().catch(100),
  verdictLabel: SafeDefaultString("Evaluación Completada"),
  verdictSummary: SafeDefaultString("Resumen de desempeño generado por DevCareer AI."),
  status: z.enum(["high", "mid", "low"]).catch("mid"),
  badges: SafeStringList.optional(),
});

export const InterviewReportContextSchema = z
  .object({
    candidateName: SafeOptionalString,
    role: SafeOptionalString,
    company: SafeOptionalString,
    level: SafeOptionalString,
    interviewType: SafeOptionalString,
    techstack: z.unknown().transform((val): string[] | undefined => {
      if (Array.isArray(val)) {
        const items = val
          .map((item) => String(item ?? "").trim())
          .filter(Boolean);
        return items.length > 0 ? items : undefined;
      }
      if (typeof val === "string" && val.trim().length > 0) {
        const items = val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return items.length > 0 ? items : undefined;
      }
      return undefined;
    }),
  })
  .nullish()
  .transform((val) => val ?? undefined);

export const EnglishFeedbackReportSchema = z.object({
  overallLevel: SafeDefaultString("B1"),
  grammarScore: ClampedPercentage,
  vocabularyScore: ClampedPercentage,
  fluencyScore: ClampedPercentage,
  grammarErrors: SafeStringList,
  vocabularySuggestions: SafeStringList,
  overallComment: SafeDefaultString(""),
});

export const FacialFeedbackReportSchema = z.object({
  overallScore: ClampedPercentage,
  expressiveProfile: SafeDefaultString("Equilibrado"),
  summaryComment: SafeDefaultString(""),
  metrics: z
    .object({
      eyeContact: ClampedPercentage,
      composure: ClampedPercentage,
      gestureBalance: ClampedPercentage,
      postureStability: ClampedPercentage,
      warmth: ClampedPercentage,
      blinkRatePerMin: z.coerce.number().finite().min(0).catch(0),
      facePresencePercent: ClampedPercentage,
    })
    .nullish()
    .transform(
      (m) =>
        m ?? {
          eyeContact: 0,
          composure: 0,
          gestureBalance: 0,
          postureStability: 0,
          warmth: 0,
          blinkRatePerMin: 0,
          facePresencePercent: 0,
        }
    ),
  strengths: SafeStringList,
  habitsToImprove: SafeStringList,
  coachingTips: SafeStringList,
});

const OptionalEnglishFeedbackSchema = z
  .unknown()
  .transform((val) => {
    if (!val || typeof val !== "object") return undefined;
    const parsed = EnglishFeedbackReportSchema.safeParse(val);
    return parsed.success ? parsed.data : undefined;
  });

const OptionalFacialFeedbackSchema = z
  .unknown()
  .transform((val) => {
    if (!val || typeof val !== "object") return undefined;
    const parsed = FacialFeedbackReportSchema.safeParse(val);
    return parsed.success ? parsed.data : undefined;
  });

const CategoryScoreItemSchema = z.object({
  name: SafeDefaultString("Competencia"),
  score: ClampedPercentage,
  comment: SafeDefaultString(""),
});

export const InterviewFeedbackReportSchema = z.object({
  interviewId: SafeDefaultString("sin-id"),
  totalScore: ClampedPercentage,
  categoryScores: z.unknown().transform((val) => {
    if (!Array.isArray(val)) return [];
    return val
      .map((item) => CategoryScoreItemSchema.safeParse(item))
      .filter((r): r is { success: true; data: z.infer<typeof CategoryScoreItemSchema> } => r.success)
      .map((r) => r.data);
  }),
  strengths: SafeStringList,
  areasForImprovement: SafeStringList,
  finalAssessment: SafeDefaultString(""),
  createdAt: SafeOptionalString,
  englishFeedback: OptionalEnglishFeedbackSchema,
  facialFeedback: OptionalFacialFeedbackSchema,
});

export const UserDashboardReportSchema = z.object({
  userId: SafeDefaultString("usuario"),
  userName: SafeDefaultString("Candidato"),
  totalInterviews: z.coerce.number().int().min(0).catch(0),
  averageScore: ClampedPercentage,
  technicalScore: ClampedPercentage,
  communicationScore: ClampedPercentage,
  cefrLevel: SafeDefaultString("B2"),
  topStrengths: SafeStringList,
  keyImprovements: SafeStringList,
  totalApplications: z.coerce.number().int().min(0).catch(0),
});

export type ValidatedInterviewFeedback = z.infer<typeof InterviewFeedbackReportSchema>;
export type ValidatedEnglishFeedback = z.infer<typeof EnglishFeedbackReportSchema>;
export type ValidatedFacialFeedback = z.infer<typeof FacialFeedbackReportSchema>;
export type ValidatedDashboardStats = z.infer<typeof UserDashboardReportSchema>;
export type ValidatedReportContext = z.infer<typeof InterviewReportContextSchema>;
