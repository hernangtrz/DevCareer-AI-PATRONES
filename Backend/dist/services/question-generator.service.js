"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionGeneratorService = void 0;
const constants_1 = require("../config/constants");
const interviews_service_1 = require("./interviews.service");
const ai_provider_factory_1 = require("./ai/ai-provider.factory");
/**
 * Servicio especializado en la generación y orquestación de preguntas para entrevistas (CC-05).
 * Aplica el patrón Service Layer / Facade (SRP / DIP), aislando la creación en base de datos,
 * la interacción con el proveedor de IA y el ciclo asíncrono en segundo plano.
 */
class QuestionGeneratorService {
    constructor(aiProvider = ai_provider_factory_1.AIProviderFactory.getProvider()) {
        this.aiProvider = aiProvider;
    }
    /**
     * Crea inmediatamente el registro de la entrevista y desencadena la generación de preguntas en segundo plano.
     * @returns ID de la entrevista creada.
     */
    async createAndInitiateGeneration(input) {
        const formattedTechstack = typeof input.techstack === "string"
            ? input.techstack.split(",").map((s) => s.trim())
            : Array.isArray(input.techstack)
                ? input.techstack
                : [];
        // 1. Crear la entrevista en la base de datos como no finalizada
        const interviewId = await (0, interviews_service_1.createInterview)({
            role: input.role,
            type: input.type,
            level: input.level,
            techstack: formattedTechstack,
            questions: [],
            userId: input.userId || "user_unknown",
            finalized: false,
            coverImage: (0, constants_1.getRandomInterviewCover)(),
            createdAt: new Date().toISOString(),
        });
        // 2. Procesar la generación en segundo plano sin bloquear al cliente
        this.generateQuestionsInBackground(interviewId, input, formattedTechstack).catch((err) => {
            console.error(`[QuestionGeneratorService] Error no controlado en background para entrevista ${interviewId}:`, err?.message || err);
        });
        return interviewId;
    }
    async generateQuestionsInBackground(interviewId, input, techstack) {
        try {
            console.log(`[QuestionGeneratorService] Iniciando generación para entrevista ${interviewId}...`);
            const prompt = `Prepara preguntas para una entrevista de trabajo.
El rol es: ${input.role}.
El nivel de experiencia es: ${input.level}.
El stack tecnológico es: ${techstack.join(", ")}.
El enfoque es: ${input.type}.
La cantidad de preguntas requeridas es: ${input.amount}.
Devuelve ÚNICAMENTE un array JSON con las preguntas, sin texto adicional, sin backticks:
["Pregunta 1", "Pregunta 2", "Pregunta 3"]`;
            const questions = await this.aiProvider.generateJson([{ text: prompt }], { temperature: 0.7 });
            const interview = await (0, interviews_service_1.getInterviewById)(interviewId);
            if (interview) {
                interview.questions = Array.isArray(questions) ? questions : [];
                interview.finalized = true;
                await (0, interviews_service_1.updateInterview)(interview);
                console.log(`[QuestionGeneratorService] Entrevista ${interviewId} generada exitosamente con ${interview.questions.length} preguntas.`);
            }
        }
        catch (bgError) {
            console.error(`[QuestionGeneratorService] Error generando preguntas para entrevista ${interviewId}:`, bgError?.message || bgError);
        }
    }
}
exports.QuestionGeneratorService = QuestionGeneratorService;
//# sourceMappingURL=question-generator.service.js.map