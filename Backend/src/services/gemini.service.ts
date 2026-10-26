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

import {
  InterviewFeedbackResult,
  EnglishProficiencyFeedback,
  CvAtsAnalysisResult,
  CodeEvaluationResult,
  AnalyzeCvAtsParams,
  EvaluateCodeChallengeParams,
} from "./ai";
import { AIServiceFacade } from "../patterns/facade";
import { GeminiAdapter } from "./ai/gemini.adapter";
import { AIProviderFactory } from "./ai/ai-provider.factory";

export {
  InterviewFeedbackResult,
  EnglishProficiencyFeedback,
  CvAtsAnalysisResult,
  CodeEvaluationResult,
  AnalyzeCvAtsParams,
  EvaluateCodeChallengeParams,
};

// Instancia centralizada de la Fachada de IA
const aiFacade = new AIServiceFacade();
const defaultAdapter = new GeminiAdapter();

/**
 * Limpia y parsea respuestas JSON devueltas por modelos de lenguaje.
 */
export function sanitizeAndParseJson<T = any>(rawText: string): T {
  return defaultAdapter.sanitizeAndParseJson<T>(rawText);
}

/**
 * @deprecated VULNERABILIDAD MITIGADA: Este método expone una puerta trasera cruda (Backdoor Facade).
 * Se mantiene temporalmente solo por compatibilidad de tests heredados, pero no debe ser
 * utilizado en código de producción. Utilizar los métodos tipados de `AIServiceFacade`.
 */
export async function callGeminiRaw(
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
  options: { temperature?: number; model?: string } = {}
): Promise<any> {
  console.warn("[Security Warning] Invocación a método no tipado callGeminiRaw(). Migre a AIServiceFacade.");
  const provider = AIProviderFactory.getProvider();
  return provider.generateJson(parts, options);
}

/**
 * Genera feedback multidimensional para una entrevista delegando en AIServiceFacade.
 */
export async function generateInterviewFeedback(
  formattedTranscript: string,
  isEnglish: boolean
): Promise<InterviewFeedbackResult> {
  return aiFacade.evaluateInterview(formattedTranscript, isEnglish);
}

/**
 * Genera evaluación CEFR de competencia en idioma inglés delegando en AIServiceFacade.
 */
export async function generateEnglishProficiencyFeedback(
  formattedTranscript: string
): Promise<EnglishProficiencyFeedback> {
  return aiFacade.evaluateEnglishProficiency(formattedTranscript);
}

/**
 * Analiza compatibilidad ATS entre un CV y una oferta de empleo delegando en AIServiceFacade.
 */
export async function analyzeCvAts(params: AnalyzeCvAtsParams): Promise<CvAtsAnalysisResult> {
  return aiFacade.analyzeCvAts(params);
}

/**
 * Evalúa una solución de código en cuanto a algoritmos, complejidad y principios SOLID delegando en AIServiceFacade.
 */
export async function evaluateCodeChallenge(
  params: EvaluateCodeChallengeParams
): Promise<CodeEvaluationResult> {
  return aiFacade.evaluateCodeChallenge(params);
}
