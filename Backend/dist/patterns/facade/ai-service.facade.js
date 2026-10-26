"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServiceFacade = void 0;
const ai_1 = require("../../services/ai");
const cv_optimization_service_1 = require("../../services/cv-optimization.service");
const ai_provider_factory_1 = require("../../services/ai/ai-provider.factory");
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
class AIServiceFacade {
    constructor(aiProvider) {
        const provider = aiProvider || ai_provider_factory_1.AIProviderFactory.getProvider();
        this.interviewEvaluationService = new ai_1.InterviewEvaluationService(provider);
        this.englishProficiencyService = new ai_1.EnglishProficiencyService(provider);
        this.cvAnalysisService = new ai_1.CvAnalysisService(provider);
        this.codeChallengeService = new ai_1.CodeChallengeService(provider);
        this.cvOptimizationService = new cv_optimization_service_1.CvOptimizationService(provider);
    }
    /**
     * Evalúa multidimensionalmente el desempeño técnico y blando en una entrevista de voz.
     */
    async evaluateInterview(formattedTranscript, isEnglish) {
        return this.interviewEvaluationService.evaluate(formattedTranscript, isEnglish);
    }
    /**
     * Evalúa la competencia lingüística bajo el estándar europeo CEFR (A1-C2).
     */
    async evaluateEnglishProficiency(formattedTranscript) {
        return this.englishProficiencyService.evaluate(formattedTranscript);
    }
    /**
     * Analiza compatibilidad ATS entre un CV (PDF en Base64 o Texto) y una oferta laboral.
     */
    async analyzeCvAts(params) {
        return this.cvAnalysisService.analyze(params);
    }
    /**
     * Evalúa una solución de código en cuanto a corrección, complejidad Big-O y principios SOLID.
     */
    async evaluateCodeChallenge(params) {
        return this.codeChallengeService.evaluate(params);
    }
    /**
     * Optimiza el contenido completo de una hoja de vida (titulares, perfil y viñetas de logros).
     */
    async optimizeCv(input) {
        return this.cvOptimizationService.improveCv(input);
    }
    /**
     * Optimiza el resumen ejecutivo del perfil profesional para aumentar impacto.
     */
    async optimizeProfile(input) {
        return this.cvOptimizationService.improveProfile(input);
    }
}
exports.AIServiceFacade = AIServiceFacade;
//# sourceMappingURL=ai-service.facade.js.map