"use strict";
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
 * Evalúa una solución de código en cuanto a algoritmos, complejidad y patrones de diseño.
 */
async function evaluateCodeChallenge(params) {
    return codeChallengeService.evaluate(params);
}
//# sourceMappingURL=gemini.service.js.map