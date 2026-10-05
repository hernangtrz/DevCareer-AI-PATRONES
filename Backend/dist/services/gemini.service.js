"use strict";
/**
 * gemini.service.ts (Capa de compatibilidad orientada a objetos)
 *
 * Refactorización CC-04 (Principios SOLID: SRP, DIP, OCP):
 * La lógica centralizada del monolito anterior se segregó en servicios con responsabilidad única dentro de `src/services/ai/`:
 *  - IAIProvider (Abstracción e Inversión de Dependencias - DIP / OCP)
 *  - GeminiAdapter (Implementación concreta para la API de Google Gemini)
 *  - AIProviderFactory (Resolución desacoplada de dependencias)
 *  - InterviewEvaluationService (Responsabilidad única: Evaluación de entrevistas)
 *  - EnglishProficiencyService (Responsabilidad única: Evaluación de nivel de inglés CEFR)
 *  - CvAnalysisService (Responsabilidad única: Análisis de compatibilidad ATS)
 *  - CodeChallengeService (Responsabilidad única: Evaluación técnica de código)
 *
 * Este archivo preserva la API pública hacia atrás para no romper código existente,
 * delegando completamente la ejecución a los servicios especializados.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeAndParseJson = sanitizeAndParseJson;
exports.callGeminiRaw = callGeminiRaw;
exports.generateInterviewFeedback = generateInterviewFeedback;
exports.generateEnglishProficiencyFeedback = generateEnglishProficiencyFeedback;
exports.analyzeCvAts = analyzeCvAts;
exports.evaluateCodeChallenge = evaluateCodeChallenge;
const ai_1 = require("./ai");
const defaultAdapter = new ai_1.GeminiAdapter();
const interviewEvaluationService = new ai_1.InterviewEvaluationService();
const englishProficiencyService = new ai_1.EnglishProficiencyService();
const cvAnalysisService = new ai_1.CvAnalysisService();
const codeChallengeService = new ai_1.CodeChallengeService();
/**
 * Limpia y parsea respuestas JSON devueltas por modelos de lenguaje.
 */
function sanitizeAndParseJson(rawText) {
    return defaultAdapter.sanitizeAndParseJson(rawText);
}
/**
 * Ejecuta una petición directa a través del proveedor de IA configurado.
 */
async function callGeminiRaw(parts, options = {}) {
    const provider = ai_1.AIProviderFactory.getProvider();
    return provider.generateJson(parts, options);
}
/**
 * Genera feedback multidimensional para una entrevista.
 */
async function generateInterviewFeedback(formattedTranscript, isEnglish) {
    return interviewEvaluationService.evaluate(formattedTranscript, isEnglish);
}
/**
 * Genera evaluación CEFR de competencia en idioma inglés.
 */
async function generateEnglishProficiencyFeedback(formattedTranscript) {
    return englishProficiencyService.evaluate(formattedTranscript);
}
/**
 * Analiza compatibilidad ATS entre un CV y una oferta de empleo.
 */
async function analyzeCvAts(params) {
    return cvAnalysisService.analyze(params);
}
/**
 * Evalúa una solución de código en cuanto a algoritmos, complejidad y principios SOLID.
 */
async function evaluateCodeChallenge(params) {
    return codeChallengeService.evaluate(params);
}
//# sourceMappingURL=gemini.service.js.map