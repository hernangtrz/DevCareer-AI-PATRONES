"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDashboardReportSchema = exports.InterviewFeedbackReportSchema = exports.FacialFeedbackReportSchema = exports.EnglishFeedbackReportSchema = exports.InterviewReportContextSchema = exports.ExecutiveHighlightSchema = exports.ScoreMetricItemSchema = exports.KeyValueItemSchema = void 0;
const zod_1 = require("zod");
/**
 * Contratos de Validación Zod para Reportes Multi-Formato (Patrón Bridge).
 * Resiliente a valores `null` / `undefined` provenientes de PostgreSQL (Supabase)
 * y DynamoDB, asegurando integridad estructural de títulos, fechas, métricas
 * y puntajes (0..max) antes de renderizar (HTML, MD, TXT, Excel).
 */
const SafeOptionalString = zod_1.z
    .unknown()
    .transform((val) => {
    if (typeof val !== "string")
        return undefined;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
});
const SafeDefaultString = (fallback) => zod_1.z.unknown().transform((val) => {
    if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed.length > 0)
            return trimmed;
    }
    return fallback;
});
const SafeStringList = zod_1.z.unknown().transform((val) => {
    if (!Array.isArray(val))
        return [];
    return val
        .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
        .filter(Boolean);
});
const ClampedPercentage = zod_1.z.coerce
    .number()
    .finite()
    .catch(0)
    .transform((n) => Math.max(0, Math.min(100, Math.round(n))));
exports.KeyValueItemSchema = zod_1.z.object({
    key: SafeDefaultString("Dato"),
    value: zod_1.z.unknown().transform((v) => String(v ?? "").trim()),
});
exports.ScoreMetricItemSchema = zod_1.z.object({
    label: SafeDefaultString("Dimensión"),
    score: zod_1.z.coerce.number().finite().catch(0),
    max: zod_1.z.coerce.number().positive().catch(100),
    comment: SafeOptionalString,
});
exports.ExecutiveHighlightSchema = zod_1.z.object({
    score: zod_1.z.coerce.number().finite().catch(0),
    max: zod_1.z.coerce.number().positive().catch(100),
    verdictLabel: SafeDefaultString("Evaluación Completada"),
    verdictSummary: SafeDefaultString("Resumen de desempeño generado por DevCareer AI."),
    status: zod_1.z.enum(["high", "mid", "low"]).catch("mid"),
    badges: SafeStringList.optional(),
});
exports.InterviewReportContextSchema = zod_1.z
    .object({
    candidateName: SafeOptionalString,
    role: SafeOptionalString,
    company: SafeOptionalString,
    level: SafeOptionalString,
    interviewType: SafeOptionalString,
    techstack: zod_1.z.unknown().transform((val) => {
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
exports.EnglishFeedbackReportSchema = zod_1.z.object({
    overallLevel: SafeDefaultString("B1"),
    grammarScore: ClampedPercentage,
    vocabularyScore: ClampedPercentage,
    fluencyScore: ClampedPercentage,
    grammarErrors: SafeStringList,
    vocabularySuggestions: SafeStringList,
    overallComment: SafeDefaultString(""),
});
exports.FacialFeedbackReportSchema = zod_1.z.object({
    overallScore: ClampedPercentage,
    expressiveProfile: SafeDefaultString("Equilibrado"),
    summaryComment: SafeDefaultString(""),
    metrics: zod_1.z
        .object({
        eyeContact: ClampedPercentage,
        composure: ClampedPercentage,
        gestureBalance: ClampedPercentage,
        postureStability: ClampedPercentage,
        warmth: ClampedPercentage,
        blinkRatePerMin: zod_1.z.coerce.number().finite().min(0).catch(0),
        facePresencePercent: ClampedPercentage,
    })
        .nullish()
        .transform((m) => m ?? {
        eyeContact: 0,
        composure: 0,
        gestureBalance: 0,
        postureStability: 0,
        warmth: 0,
        blinkRatePerMin: 0,
        facePresencePercent: 0,
    }),
    strengths: SafeStringList,
    habitsToImprove: SafeStringList,
    coachingTips: SafeStringList,
});
const OptionalEnglishFeedbackSchema = zod_1.z
    .unknown()
    .transform((val) => {
    if (!val || typeof val !== "object")
        return undefined;
    const parsed = exports.EnglishFeedbackReportSchema.safeParse(val);
    return parsed.success ? parsed.data : undefined;
});
const OptionalFacialFeedbackSchema = zod_1.z
    .unknown()
    .transform((val) => {
    if (!val || typeof val !== "object")
        return undefined;
    const parsed = exports.FacialFeedbackReportSchema.safeParse(val);
    return parsed.success ? parsed.data : undefined;
});
const CategoryScoreItemSchema = zod_1.z.object({
    name: SafeDefaultString("Competencia"),
    score: ClampedPercentage,
    comment: SafeDefaultString(""),
});
exports.InterviewFeedbackReportSchema = zod_1.z.object({
    interviewId: SafeDefaultString("sin-id"),
    totalScore: ClampedPercentage,
    categoryScores: zod_1.z.unknown().transform((val) => {
        if (!Array.isArray(val))
            return [];
        return val
            .map((item) => CategoryScoreItemSchema.safeParse(item))
            .filter((r) => r.success)
            .map((r) => r.data);
    }),
    strengths: SafeStringList,
    areasForImprovement: SafeStringList,
    finalAssessment: SafeDefaultString(""),
    createdAt: SafeOptionalString,
    englishFeedback: OptionalEnglishFeedbackSchema,
    facialFeedback: OptionalFacialFeedbackSchema,
});
exports.UserDashboardReportSchema = zod_1.z.object({
    userId: SafeDefaultString("usuario"),
    userName: SafeDefaultString("Candidato"),
    totalInterviews: zod_1.z.coerce.number().int().min(0).catch(0),
    averageScore: ClampedPercentage,
    technicalScore: ClampedPercentage,
    communicationScore: ClampedPercentage,
    cefrLevel: SafeDefaultString("B2"),
    topStrengths: SafeStringList,
    keyImprovements: SafeStringList,
    totalApplications: zod_1.z.coerce.number().int().min(0).catch(0),
});
//# sourceMappingURL=report-schemas.js.map