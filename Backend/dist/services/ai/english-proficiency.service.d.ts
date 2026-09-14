import { IAIProvider } from "./ai-provider.interface";
export interface EnglishProficiencyFeedback {
    overallLevel: string;
    grammarScore: number;
    vocabularyScore: number;
    fluencyScore: number;
    grammarErrors: string[];
    vocabularySuggestions: string[];
    overallComment: string;
}
/**
 * Servicio especializado en evaluación de nivel de inglés (CEFR) (SRP).
 * Analiza métricas lingüísticas de fluidez, vocabulario y gramática a partir de la transcripción.
 */
export declare class EnglishProficiencyService {
    private aiProvider;
    constructor(aiProvider?: IAIProvider);
    evaluate(formattedTranscript: string): Promise<EnglishProficiencyFeedback>;
}
