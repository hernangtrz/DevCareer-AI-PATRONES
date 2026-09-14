/**
 * gemini.service.ts (Fachada de compatibilidad - Patrón Facade / Strategy / Adapter)
 *
 * Refactorización CC-04 (SOLID: SRP, DIP, OCP):
 * La lógica centralizada se ha segregado en servicios de responsabilidad única dentro de `src/services/ai/`:
 *  - IAIProvider (Contrato abstracto)
 *  - GeminiAdapter (Adaptador concreto para la API de Google Gemini)
 *  - AIProviderFactory (Factoría de resolución de proveedor)
 *  - InterviewEvaluationService (Evaluación de entrevistas de voz)
 *  - EnglishProficiencyService (Evaluación de nivel de inglés CEFR)
 *  - CvAnalysisService (Análisis de compatibilidad ATS)
 *  - CodeChallengeService (Evaluación de algoritmos y patrones de diseño)
 *
 * Este archivo preserva la API pública hacia atrás para no romper código existente,
 * delegando completamente la ejecución a los servicios especializados.
 */
import { InterviewFeedbackResult, EnglishProficiencyFeedback, CvAtsAnalysisResult, CodeEvaluationResult, AnalyzeCvAtsParams, EvaluateCodeChallengeParams } from "./ai";
export { InterviewFeedbackResult, EnglishProficiencyFeedback, CvAtsAnalysisResult, CodeEvaluationResult, AnalyzeCvAtsParams, EvaluateCodeChallengeParams, };
/**
 * Limpia y parsea respuestas JSON devueltas por modelos de lenguaje.
 */
export declare function sanitizeAndParseJson<T = any>(rawText: string): T;
/**
 * Ejecuta una petición directa a través del proveedor de IA configurado.
 */
export declare function callGeminiRaw(parts: Array<{
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
}>, options?: {
    temperature?: number;
    model?: string;
}): Promise<any>;
/**
 * Genera feedback multidimensional para una entrevista.
 */
export declare function generateInterviewFeedback(formattedTranscript: string, isEnglish: boolean): Promise<InterviewFeedbackResult>;
/**
 * Genera evaluación CEFR de competencia en idioma inglés.
 */
export declare function generateEnglishProficiencyFeedback(formattedTranscript: string): Promise<EnglishProficiencyFeedback>;
/**
 * Analiza compatibilidad ATS entre un CV y una oferta de empleo.
 */
export declare function analyzeCvAts(params: AnalyzeCvAtsParams): Promise<CvAtsAnalysisResult>;
/**
 * Evalúa una solución de código en cuanto a algoritmos, complejidad y patrones de diseño.
 */
export declare function evaluateCodeChallenge(params: EvaluateCodeChallengeParams): Promise<CodeEvaluationResult>;
