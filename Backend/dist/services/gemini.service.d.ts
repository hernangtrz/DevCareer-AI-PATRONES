/**
 * gemini.service.ts (Capa de compatibilidad orientada al Patrón Facade)
 *
 * Refactorización CC-04 / CC-09 (Patrón Estructural Facade - GoF):
 * Este archivo actúa como una capa puente de compatibilidad hacia atrás, delegando
 * todas las operaciones en la fachada centralizada y tipada `AIServiceFacade`.
 *
 * Correcciones de seguridad:
 *  - La puerta trasera de ejecución arbitraria `callGeminiRaw` se encuentra deprecada
 *    y restringida, cerrando vulnerabilidades de Prompt Injection.
 *  - Se desacopla la nomenclatura del vendor hacia el contrato unificado de la Fachada.
 */
import { InterviewFeedbackResult, EnglishProficiencyFeedback, CvAtsAnalysisResult, CodeEvaluationResult, AnalyzeCvAtsParams, EvaluateCodeChallengeParams } from "./ai";
export { InterviewFeedbackResult, EnglishProficiencyFeedback, CvAtsAnalysisResult, CodeEvaluationResult, AnalyzeCvAtsParams, EvaluateCodeChallengeParams, };
/**
 * Limpia y parsea respuestas JSON devueltas por modelos de lenguaje.
 */
export declare function sanitizeAndParseJson<T = any>(rawText: string): T;
/**
 * @deprecated VULNERABILIDAD MITIGADA: Este método expone una puerta trasera cruda (Backdoor Facade).
 * Se mantiene temporalmente solo por compatibilidad de tests heredados, pero no debe ser
 * utilizado en código de producción. Utilizar los métodos tipados de `AIServiceFacade`.
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
 * Genera feedback multidimensional para una entrevista delegando en AIServiceFacade.
 */
export declare function generateInterviewFeedback(formattedTranscript: string, isEnglish: boolean): Promise<InterviewFeedbackResult>;
/**
 * Genera evaluación CEFR de competencia en idioma inglés delegando en AIServiceFacade.
 */
export declare function generateEnglishProficiencyFeedback(formattedTranscript: string): Promise<EnglishProficiencyFeedback>;
/**
 * Analiza compatibilidad ATS entre un CV y una oferta de empleo delegando en AIServiceFacade.
 */
export declare function analyzeCvAts(params: AnalyzeCvAtsParams): Promise<CvAtsAnalysisResult>;
/**
 * Evalúa una solución de código en cuanto a algoritmos, complejidad y principios SOLID delegando en AIServiceFacade.
 */
export declare function evaluateCodeChallenge(params: EvaluateCodeChallengeParams): Promise<CodeEvaluationResult>;
