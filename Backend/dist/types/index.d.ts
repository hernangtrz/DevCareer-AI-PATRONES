export interface User {
    id: string;
    name: string;
    email: string;
}
export interface Interview {
    company?: string;
    id: string;
    role: string;
    level: string;
    questions: string[];
    techstack: string[];
    createdAt: string;
    userId: string;
    type: string;
    finalized: boolean;
    coverImage?: string;
}
export interface Feedback {
    id: string;
    interviewId: string;
    userId: string;
    totalScore: number;
    categoryScores: Array<{
        name: string;
        score: number;
        comment: string;
    }>;
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
    createdAt: string;
    englishFeedback?: {
        overallLevel: string;
        grammarScore: number;
        vocabularyScore: number;
        fluencyScore: number;
        grammarErrors: string[];
        vocabularySuggestions: string[];
        overallComment: string;
    };
    facialFeedback?: FacialBehaviorFeedback;
}
export interface FacialTimelineBucket {
    second: number;
    tension: number;
    eyeContact: number;
    gestureIntensity: number;
    warmth: number;
    speaker: "user" | "agent";
}
export interface FacialPeakEvent {
    timestampSec: number;
    type: "high_tension" | "over_gesturing" | "low_eye_contact" | "rigid_posture" | "rapid_blinking";
    severity: "moderate" | "high";
    durationSec: number;
    contextSnippet?: string;
}
export interface FacialTelemetrySummary {
    enabled: boolean;
    durationSeconds: number;
    sampledFrames: number;
    validFaceFrames: number;
    facePresenceRatio: number;
    calibrated: boolean;
    scores: {
        overallPresence: number;
        eyeContact: number;
        composure: number;
        gestureBalance: number;
        postureStability: number;
        warmth: number;
    };
    indicators: {
        avgTensionIndex: number;
        gestureProfile: "natural" | "over_expressive" | "rigid";
        blinkRatePerMin: number;
        headMovementVolatility: number;
        speakingVsListening: {
            speakingTensionAvg: number;
            listeningEyeContactAvg: number;
        };
    };
    timeline: FacialTimelineBucket[];
    peakEvents: FacialPeakEvent[];
}
export interface FacialBehaviorFeedback {
    overallScore: number;
    expressiveProfile: string;
    summaryComment: string;
    metrics: {
        eyeContact: number;
        composure: number;
        gestureBalance: number;
        postureStability: number;
        warmth: number;
        blinkRatePerMin: number;
        facePresencePercent: number;
    };
    strengths: string[];
    habitsToImprove: string[];
    coachingTips: string[];
    keyMoments: Array<{
        timestampSec: number;
        label: string;
        observation: string;
    }>;
    timeline: FacialTimelineBucket[];
}
export interface CreateFeedbackParams {
    interviewId: string;
    userId: string;
    transcript: {
        role: string;
        content: string;
    }[];
    facialMetrics?: FacialTelemetrySummary;
}
export interface GetLatestInterviewsParams {
    userId: string;
    limit?: number;
}
export interface GetFeedbackByInterviewIdParams {
    interviewId: string;
    userId: string;
}
export interface SignUpParams {
    uid: string;
    name: string;
    email: string;
}
export interface SignInParams {
    email: string;
    idToken: string;
}
export * from "./job.types";
