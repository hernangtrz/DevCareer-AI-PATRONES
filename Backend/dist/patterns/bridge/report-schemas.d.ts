import { z } from "zod";
export declare const KeyValueItemSchema: z.ZodObject<{
    key: z.ZodEffects<z.ZodUnknown, string, unknown>;
    value: z.ZodEffects<z.ZodUnknown, string, unknown>;
}, "strip", z.ZodTypeAny, {
    value?: string;
    key?: string;
}, {
    value?: unknown;
    key?: unknown;
}>;
export declare const ScoreMetricItemSchema: z.ZodObject<{
    label: z.ZodEffects<z.ZodUnknown, string, unknown>;
    score: z.ZodCatch<z.ZodNumber>;
    max: z.ZodCatch<z.ZodNumber>;
    comment: z.ZodEffects<z.ZodUnknown, string, unknown>;
}, "strip", z.ZodTypeAny, {
    max?: number;
    score?: number;
    comment?: string;
    label?: string;
}, {
    max?: unknown;
    score?: unknown;
    comment?: unknown;
    label?: unknown;
}>;
export declare const ExecutiveHighlightSchema: z.ZodObject<{
    score: z.ZodCatch<z.ZodNumber>;
    max: z.ZodCatch<z.ZodNumber>;
    verdictLabel: z.ZodEffects<z.ZodUnknown, string, unknown>;
    verdictSummary: z.ZodEffects<z.ZodUnknown, string, unknown>;
    status: z.ZodCatch<z.ZodEnum<["high", "mid", "low"]>>;
    badges: z.ZodOptional<z.ZodEffects<z.ZodUnknown, string[], unknown>>;
}, "strip", z.ZodTypeAny, {
    max?: number;
    status?: "high" | "low" | "mid";
    score?: number;
    verdictLabel?: string;
    verdictSummary?: string;
    badges?: string[];
}, {
    max?: unknown;
    status?: unknown;
    score?: unknown;
    verdictLabel?: unknown;
    verdictSummary?: unknown;
    badges?: unknown;
}>;
export declare const InterviewReportContextSchema: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodObject<{
    candidateName: z.ZodEffects<z.ZodUnknown, string, unknown>;
    role: z.ZodEffects<z.ZodUnknown, string, unknown>;
    company: z.ZodEffects<z.ZodUnknown, string, unknown>;
    level: z.ZodEffects<z.ZodUnknown, string, unknown>;
    interviewType: z.ZodEffects<z.ZodUnknown, string, unknown>;
    techstack: z.ZodEffects<z.ZodUnknown, string[], unknown>;
}, "strip", z.ZodTypeAny, {
    company?: string;
    role?: string;
    level?: string;
    techstack?: string[];
    candidateName?: string;
    interviewType?: string;
}, {
    company?: unknown;
    role?: unknown;
    level?: unknown;
    techstack?: unknown;
    candidateName?: unknown;
    interviewType?: unknown;
}>>>, {
    company?: string;
    role?: string;
    level?: string;
    techstack?: string[];
    candidateName?: string;
    interviewType?: string;
}, {
    company?: unknown;
    role?: unknown;
    level?: unknown;
    techstack?: unknown;
    candidateName?: unknown;
    interviewType?: unknown;
}>;
export declare const EnglishFeedbackReportSchema: z.ZodObject<{
    overallLevel: z.ZodEffects<z.ZodUnknown, string, unknown>;
    grammarScore: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    vocabularyScore: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    fluencyScore: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    grammarErrors: z.ZodEffects<z.ZodUnknown, string[], unknown>;
    vocabularySuggestions: z.ZodEffects<z.ZodUnknown, string[], unknown>;
    overallComment: z.ZodEffects<z.ZodUnknown, string, unknown>;
}, "strip", z.ZodTypeAny, {
    overallLevel?: string;
    grammarScore?: number;
    vocabularyScore?: number;
    fluencyScore?: number;
    grammarErrors?: string[];
    vocabularySuggestions?: string[];
    overallComment?: string;
}, {
    overallLevel?: unknown;
    grammarScore?: unknown;
    vocabularyScore?: unknown;
    fluencyScore?: unknown;
    grammarErrors?: unknown;
    vocabularySuggestions?: unknown;
    overallComment?: unknown;
}>;
export declare const FacialFeedbackReportSchema: z.ZodObject<{
    overallScore: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    expressiveProfile: z.ZodEffects<z.ZodUnknown, string, unknown>;
    summaryComment: z.ZodEffects<z.ZodUnknown, string, unknown>;
    metrics: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodObject<{
        eyeContact: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
        composure: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
        gestureBalance: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
        postureStability: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
        warmth: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
        blinkRatePerMin: z.ZodCatch<z.ZodNumber>;
        facePresencePercent: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    }, "strip", z.ZodTypeAny, {
        eyeContact?: number;
        composure?: number;
        gestureBalance?: number;
        postureStability?: number;
        warmth?: number;
        blinkRatePerMin?: number;
        facePresencePercent?: number;
    }, {
        eyeContact?: unknown;
        composure?: unknown;
        gestureBalance?: unknown;
        postureStability?: unknown;
        warmth?: unknown;
        blinkRatePerMin?: unknown;
        facePresencePercent?: unknown;
    }>>>, {
        eyeContact?: number;
        composure?: number;
        gestureBalance?: number;
        postureStability?: number;
        warmth?: number;
        blinkRatePerMin?: number;
        facePresencePercent?: number;
    }, {
        eyeContact?: unknown;
        composure?: unknown;
        gestureBalance?: unknown;
        postureStability?: unknown;
        warmth?: unknown;
        blinkRatePerMin?: unknown;
        facePresencePercent?: unknown;
    }>;
    strengths: z.ZodEffects<z.ZodUnknown, string[], unknown>;
    habitsToImprove: z.ZodEffects<z.ZodUnknown, string[], unknown>;
    coachingTips: z.ZodEffects<z.ZodUnknown, string[], unknown>;
}, "strip", z.ZodTypeAny, {
    strengths?: string[];
    overallScore?: number;
    expressiveProfile?: string;
    summaryComment?: string;
    metrics?: {
        eyeContact?: number;
        composure?: number;
        gestureBalance?: number;
        postureStability?: number;
        warmth?: number;
        blinkRatePerMin?: number;
        facePresencePercent?: number;
    };
    habitsToImprove?: string[];
    coachingTips?: string[];
}, {
    strengths?: unknown;
    overallScore?: unknown;
    expressiveProfile?: unknown;
    summaryComment?: unknown;
    metrics?: {
        eyeContact?: unknown;
        composure?: unknown;
        gestureBalance?: unknown;
        postureStability?: unknown;
        warmth?: unknown;
        blinkRatePerMin?: unknown;
        facePresencePercent?: unknown;
    };
    habitsToImprove?: unknown;
    coachingTips?: unknown;
}>;
export declare const InterviewFeedbackReportSchema: z.ZodObject<{
    interviewId: z.ZodEffects<z.ZodUnknown, string, unknown>;
    totalScore: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    categoryScores: z.ZodEffects<z.ZodUnknown, {
        name?: string;
        score?: number;
        comment?: string;
    }[], unknown>;
    strengths: z.ZodEffects<z.ZodUnknown, string[], unknown>;
    areasForImprovement: z.ZodEffects<z.ZodUnknown, string[], unknown>;
    finalAssessment: z.ZodEffects<z.ZodUnknown, string, unknown>;
    createdAt: z.ZodEffects<z.ZodUnknown, string, unknown>;
    englishFeedback: z.ZodEffects<z.ZodUnknown, {
        overallLevel?: string;
        grammarScore?: number;
        vocabularyScore?: number;
        fluencyScore?: number;
        grammarErrors?: string[];
        vocabularySuggestions?: string[];
        overallComment?: string;
    }, unknown>;
    facialFeedback: z.ZodEffects<z.ZodUnknown, {
        strengths?: string[];
        overallScore?: number;
        expressiveProfile?: string;
        summaryComment?: string;
        metrics?: {
            eyeContact?: number;
            composure?: number;
            gestureBalance?: number;
            postureStability?: number;
            warmth?: number;
            blinkRatePerMin?: number;
            facePresencePercent?: number;
        };
        habitsToImprove?: string[];
        coachingTips?: string[];
    }, unknown>;
}, "strip", z.ZodTypeAny, {
    createdAt?: string;
    interviewId?: string;
    totalScore?: number;
    categoryScores?: {
        name?: string;
        score?: number;
        comment?: string;
    }[];
    strengths?: string[];
    areasForImprovement?: string[];
    finalAssessment?: string;
    englishFeedback?: {
        overallLevel?: string;
        grammarScore?: number;
        vocabularyScore?: number;
        fluencyScore?: number;
        grammarErrors?: string[];
        vocabularySuggestions?: string[];
        overallComment?: string;
    };
    facialFeedback?: {
        strengths?: string[];
        overallScore?: number;
        expressiveProfile?: string;
        summaryComment?: string;
        metrics?: {
            eyeContact?: number;
            composure?: number;
            gestureBalance?: number;
            postureStability?: number;
            warmth?: number;
            blinkRatePerMin?: number;
            facePresencePercent?: number;
        };
        habitsToImprove?: string[];
        coachingTips?: string[];
    };
}, {
    createdAt?: unknown;
    interviewId?: unknown;
    totalScore?: unknown;
    categoryScores?: unknown;
    strengths?: unknown;
    areasForImprovement?: unknown;
    finalAssessment?: unknown;
    englishFeedback?: unknown;
    facialFeedback?: unknown;
}>;
export declare const UserDashboardReportSchema: z.ZodObject<{
    userId: z.ZodEffects<z.ZodUnknown, string, unknown>;
    userName: z.ZodEffects<z.ZodUnknown, string, unknown>;
    totalInterviews: z.ZodCatch<z.ZodNumber>;
    averageScore: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    technicalScore: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    communicationScore: z.ZodEffects<z.ZodCatch<z.ZodNumber>, number, unknown>;
    cefrLevel: z.ZodEffects<z.ZodUnknown, string, unknown>;
    topStrengths: z.ZodEffects<z.ZodUnknown, string[], unknown>;
    keyImprovements: z.ZodEffects<z.ZodUnknown, string[], unknown>;
    totalApplications: z.ZodCatch<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    userName?: string;
    totalInterviews?: number;
    averageScore?: number;
    technicalScore?: number;
    communicationScore?: number;
    cefrLevel?: string;
    topStrengths?: string[];
    keyImprovements?: string[];
    totalApplications?: number;
}, {
    userId?: unknown;
    userName?: unknown;
    totalInterviews?: unknown;
    averageScore?: unknown;
    technicalScore?: unknown;
    communicationScore?: unknown;
    cefrLevel?: unknown;
    topStrengths?: unknown;
    keyImprovements?: unknown;
    totalApplications?: unknown;
}>;
export type ValidatedInterviewFeedback = z.infer<typeof InterviewFeedbackReportSchema>;
export type ValidatedEnglishFeedback = z.infer<typeof EnglishFeedbackReportSchema>;
export type ValidatedFacialFeedback = z.infer<typeof FacialFeedbackReportSchema>;
export type ValidatedDashboardStats = z.infer<typeof UserDashboardReportSchema>;
export type ValidatedReportContext = z.infer<typeof InterviewReportContextSchema>;
