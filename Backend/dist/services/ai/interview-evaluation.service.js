"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewEvaluationService = void 0;
const ai_provider_factory_1 = require("./ai-provider.factory");
/**
 * Servicio especializado en evaluación de entrevistas de voz (SRP).
 * Genera calificación multidimensional sobre transcripciones de entrevistas técnicas o conductuales.
 */
class InterviewEvaluationService {
    constructor(aiProvider = ai_provider_factory_1.AIProviderFactory.getProvider()) {
        this.aiProvider = aiProvider;
    }
    async evaluate(formattedTranscript, isEnglish) {
        const prompt = isEnglish
            ? `You are an AI interviewer analyzing a simulated job interview conducted in English. Evaluate the candidate based on structured categories. Be thorough. If there are errors or areas for improvement, point them out.
Transcript:
${formattedTranscript}

Rate the candidate from 0 to 100 in these areas and respond ONLY with a valid JSON with this exact structure, no additional text:
{
  "totalScore": number,
  "categoryScores": [
    { "name": string, "score": number, "comment": string }
  ],
  "strengths": [string],
  "areasForImprovement": [string],
  "finalAssessment": string
}

The 5 categories are:
- Communication Skills
- Technical Knowledge
- Problem Solving
- Cultural and Role Fit
- Confidence and Clarity`
            : `Eres un entrevistador de IA que analiza una entrevista simulada. Evalúa al candidato basándote en categorías estructuradas. Sé minucioso. Si hay errores o áreas de mejora, señálalos.
Transcripción:
${formattedTranscript}

Califica al candidato de 0 a 100 en estas áreas y responde ÚNICAMENTE con un JSON válido con esta estructura exacta, sin texto adicional:
{
  "totalScore": number,
  "categoryScores": [
    { "name": string, "score": number, "comment": string }
  ],
  "strengths": [string],
  "areasForImprovement": [string],
  "finalAssessment": string
}

Las 5 categorías son:
- Habilidades de Comunicación
- Conocimiento Técnico
- Resolución de Problemas
- Ajuste Cultural y al Puesto
- Confianza y Claridad`;
        return this.aiProvider.generateJson([{ text: prompt }], { temperature: 0.3 });
    }
}
exports.InterviewEvaluationService = InterviewEvaluationService;
//# sourceMappingURL=interview-evaluation.service.js.map