"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeAndParseJson = sanitizeAndParseJson;
exports.callGeminiRaw = callGeminiRaw;
exports.generateInterviewFeedback = generateInterviewFeedback;
exports.generateEnglishProficiencyFeedback = generateEnglishProficiencyFeedback;
exports.analyzeCvAts = analyzeCvAts;
exports.evaluateCodeChallenge = evaluateCodeChallenge;
const facade_1 = require("../patterns/facade");
const gemini_adapter_1 = require("./ai/gemini.adapter");
const ai_provider_factory_1 = require("./ai/ai-provider.factory");
// Instancia centralizada de la Fachada de IA
const aiFacade = new facade_1.AIServiceFacade();
const defaultAdapter = new gemini_adapter_1.GeminiAdapter();
/**
 * Limpia y parsea respuestas JSON devueltas por modelos de lenguaje.
 */
function sanitizeAndParseJson(rawText) {
    return defaultAdapter.sanitizeAndParseJson(rawText);
}
/**
 * @deprecated VULNERABILIDAD MITIGADA: Este método expone una puerta trasera cruda (Backdoor Facade).
 * Se mantiene temporalmente solo por compatibilidad de tests heredados, pero no debe ser
 * utilizado en código de producción. Utilizar los métodos tipados de `AIServiceFacade`.
 */
async function callGeminiRaw(parts, options = {}) {
    console.warn("[Security Warning] Invocación a método no tipado callGeminiRaw(). Migre a AIServiceFacade.");
    const provider = ai_provider_factory_1.AIProviderFactory.getProvider();
    return provider.generateJson(parts, options);
}
/**
 * Genera feedback multidimensional para una entrevista delegando en AIServiceFacade.
 */
async function generateInterviewFeedback(formattedTranscript, isEnglish) {
    return aiFacade.evaluateInterview(formattedTranscript, isEnglish);
}
/**
 * Genera evaluación CEFR de competencia en idioma inglés delegando en AIServiceFacade.
 */
async function generateEnglishProficiencyFeedback(formattedTranscript) {
    return aiFacade.evaluateEnglishProficiency(formattedTranscript);
}
/**
 * Analiza compatibilidad ATS entre un CV y una oferta de empleo delegando en AIServiceFacade.
 */
async function analyzeCvAts(params) {
    return aiFacade.analyzeCvAts(params);
}
/**
 * Evalúa una solución de código en cuanto a algoritmos, complejidad y principios SOLID delegando en AIServiceFacade.
 */
async function evaluateCodeChallenge(params) {
    return aiFacade.evaluateCodeChallenge(params);
}
//# sourceMappingURL=gemini.service.js.map