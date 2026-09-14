import { IAIProvider } from "./ai-provider.interface";
export interface CodeEvaluationResult {
    score: number;
    complexity: {
        time: string;
        space: string;
    };
    patternAnalysis: {
        isPatternApplied: boolean;
        patternName: string;
        solidAdherence: string;
    };
    codeSmellsEliminated: string[];
    strengths: string[];
    improvements: string[];
    interviewerTip: string;
}
export interface EvaluateCodeChallengeParams {
    code: string;
    problemTitle: string;
    problemDescription: string;
    passedCount: number;
    totalCount: number;
    isDesignPattern?: boolean;
}
/**
 * Servicio especializado en evaluación técnica de retos de código (SRP).
 * Analiza corrección algorítmica, complejidad Big-O, antipatrones y aplicación de patrones SOLID.
 */
export declare class CodeChallengeService {
    private aiProvider;
    constructor(aiProvider?: IAIProvider);
    evaluate(params: EvaluateCodeChallengeParams): Promise<CodeEvaluationResult>;
}
