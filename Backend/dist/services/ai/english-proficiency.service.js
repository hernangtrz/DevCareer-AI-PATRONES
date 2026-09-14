"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnglishProficiencyService = void 0;
const ai_provider_factory_1 = require("./ai-provider.factory");
/**
 * Servicio especializado en evaluación de nivel de inglés (CEFR) (SRP).
 * Analiza métricas lingüísticas de fluidez, vocabulario y gramática a partir de la transcripción.
 */
class EnglishProficiencyService {
    constructor(aiProvider = ai_provider_factory_1.AIProviderFactory.getProvider()) {
        this.aiProvider = aiProvider;
    }
    async evaluate(formattedTranscript) {
        const prompt = `You are an expert English language coach and CEFR evaluator. Analyze the English language quality of the CANDIDATE's messages ONLY in the following interview transcript. Focus exclusively on grammar, vocabulary, fluency and natural English expression.

Transcript (analyze only "user" role messages):
${formattedTranscript}

Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "overallLevel": "<CEFR level: A1, A2, B1, B2, C1, or C2>",
  "grammarScore": <0-100>,
  "vocabularyScore": <0-100>,
  "fluencyScore": <0-100>,
  "grammarErrors": ["<specific grammar error example 1 from transcript>", "<error 2>"],
  "vocabularySuggestions": ["<word/phrase used + better alternative>"],
  "overallComment": "<2-3 sentence overall assessment of the candidate's English level and main areas for improvement>"
}

Rules:
- grammarErrors: list up to 5 real examples directly quoted from the transcript. If the English is excellent, return an empty array.
- vocabularySuggestions: list up to 5 specific improvements. If vocabulary is advanced, return an empty array.
- Be honest and constructive.`;
        return this.aiProvider.generateJson([{ text: prompt }], { temperature: 0.2 });
    }
}
exports.EnglishProficiencyService = EnglishProficiencyService;
//# sourceMappingURL=english-proficiency.service.js.map