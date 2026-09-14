import { IAIProvider } from "./ai-provider.interface";
export interface InterviewFeedbackResult {
    totalScore: number;
    categoryScores: Array<{
        name: string;
        score: number;
        comment: string;
    }>;
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
}
/**
 * Servicio especializado en evaluación de entrevistas de voz (SRP).
 * Genera calificación multidimensional sobre transcripciones de entrevistas técnicas o conductuales.
 */
export declare class InterviewEvaluationService {
    private aiProvider;
    constructor(aiProvider?: IAIProvider);
    evaluate(formattedTranscript: string, isEnglish: boolean): Promise<InterviewFeedbackResult>;
}
