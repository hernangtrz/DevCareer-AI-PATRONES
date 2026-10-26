import { InterviewFeedbackResult, EnglishProficiencyFeedback, CvAtsAnalysisResult, CodeEvaluationResult, AnalyzeCvAtsParams, EvaluateCodeChallengeParams } from "../../services/ai";
import { ImproveCvInput, ImprovedCvResult, ImproveProfileInput, ImprovedProfileResult } from "../../services/cv-optimization.service";
import { IAIProvider } from "../../services/ai/ai-provider.interface";
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL FACADE (GoF): AIServiceFacade
 * ============================================================================
 * Proporciona una interfaz unificada, tipada y de alto nivel hacia el subsistema
 * heterogéneo de Inteligencia Artificial de DevCareer AI:
 *  - Evaluación de Entrevistas Técnicas (InterviewEvaluationService)
 *  - Evaluación Lingüística CEFR en Inglés (EnglishProficiencyService)
 *  - Diagnóstico ATS Multimodal de Currículums (CvAnalysisService)
 *  - Evaluación Algorítmica y Complejidad Big-O (CodeChallengeService)
 *  - Optimización Semántica de Hojas de Vida (CvOptimizationService)
 *
 * Correcciones de Seguridad y Arquitectura:
 * 1. Elimina la puerta trasera `callGeminiRaw` que permitía inyecciones arbitrarias de prompts.
 * 2. Desacopla a los clientes del proveedor comercial concreto (DIP / OCP).
 * 3. Permite inyección de dependencias para testing y previene bypasses directos a clases internas.
 */
export declare class AIServiceFacade {
    private interviewEvaluationService;
    private englishProficiencyService;
    private cvAnalysisService;
    private codeChallengeService;
    private cvOptimizationService;
    constructor(aiProvider?: IAIProvider);
    /**
     * Evalúa multidimensionalmente el desempeño técnico y blando en una entrevista de voz.
     */
    evaluateInterview(formattedTranscript: string, isEnglish: boolean): Promise<InterviewFeedbackResult>;
    /**
     * Evalúa la competencia lingüística bajo el estándar europeo CEFR (A1-C2).
     */
    evaluateEnglishProficiency(formattedTranscript: string): Promise<EnglishProficiencyFeedback>;
    /**
     * Analiza compatibilidad ATS entre un CV (PDF en Base64 o Texto) y una oferta laboral.
     */
    analyzeCvAts(params: AnalyzeCvAtsParams): Promise<CvAtsAnalysisResult>;
    /**
     * Evalúa una solución de código en cuanto a corrección, complejidad Big-O y principios SOLID.
     */
    evaluateCodeChallenge(params: EvaluateCodeChallengeParams): Promise<CodeEvaluationResult>;
    /**
     * Optimiza el contenido completo de una hoja de vida (titulares, perfil y viñetas de logros).
     */
    optimizeCv(input: ImproveCvInput): Promise<ImprovedCvResult>;
    /**
     * Optimiza el resumen ejecutivo del perfil profesional para aumentar impacto.
     */
    optimizeProfile(input: ImproveProfileInput): Promise<ImprovedProfileResult>;
}
