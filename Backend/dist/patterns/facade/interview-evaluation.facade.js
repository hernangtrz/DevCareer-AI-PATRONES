"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewEvaluationFacade = void 0;
const repository_factory_1 = require("../../repositories/repository.factory");
const ai_service_facade_1 = require("./ai-service.facade");
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL FACADE (GoF): InterviewEvaluationFacade
 * ============================================================================
 * Fachada de Orquestación de Alto Nivel para el proceso completo de evaluación
 * y retroalimentación de entrevistas de voz en DevCareer AI.
 *
 * Resuelve el antipatrón "Fat Controller" en `feedback.routes.ts` y desacopla
 * los siguientes subsistemas:
 *  1. Subsistema de Entrevistas (IInterviewRepository): Consulta y metadatos de sesión.
 *  2. Subsistema de Procesamiento de Transcripción: Limpieza, formato y normalización.
 *  3. Subsistema de Inteligencia Artificial (AIServiceFacade): Inferencia concurrente resiliente.
 *  4. Subsistema de Persistencia (IFeedbackRepository): Registro seguro del informe.
 */
class InterviewEvaluationFacade {
    constructor(aiFacade = new ai_service_facade_1.AIServiceFacade(), interviewRepo = repository_factory_1.RepositoryFactory.getInterviewRepository(), feedbackRepo = repository_factory_1.RepositoryFactory.getFeedbackRepository()) {
        this.aiFacade = aiFacade;
        this.interviewRepo = interviewRepo;
        this.feedbackRepo = feedbackRepo;
    }
    /**
     * Orquesta todo el flujo de generación y almacenamiento del feedback de una entrevista.
     * Encapsula los fallbacks resilientes de dominio y la concurrencia en segundo plano.
     */
    async processAndSaveEvaluation(input) {
        const { interviewId, userId, transcript, language } = input;
        if (!interviewId) {
            throw new Error("interviewId es obligatorio para procesar la evaluación.");
        }
        // 1. Determinar el idioma de la entrevista (verificando la entidad en persistencia)
        const isEnglish = await this.resolveIsEnglish(interviewId, language);
        // 2. Formatear y sanear el historial de conversación (transcript)
        const formattedTranscript = this.formatTranscript(transcript, isEnglish);
        // 3. Ejecutar evaluaciones de IA en paralelo con fallbacks resilientes
        const [feedbackData, englishData] = await Promise.all([
            this.executeTechnicalEvaluation(formattedTranscript, isEnglish),
            this.executeEnglishEvaluation(formattedTranscript, isEnglish),
        ]);
        // 4. Construir el payload del dominio para persistencia
        const feedbackPayload = {
            interviewId,
            userId: userId || "anonymous",
            totalScore: feedbackData.totalScore,
            categoryScores: feedbackData.categoryScores,
            strengths: feedbackData.strengths,
            areasForImprovement: feedbackData.areasForImprovement,
            finalAssessment: feedbackData.finalAssessment,
            englishFeedback: englishData || undefined,
            createdAt: new Date().toISOString(),
        };
        // 5. Persistir mediante el repositorio correspondiente
        const recordId = await this.feedbackRepo.create(feedbackPayload);
        return {
            feedbackId: recordId,
            feedback: {
                id: recordId,
                ...feedbackPayload,
            },
        };
    }
    /**
     * Resuelve si la entrevista debe ser evaluada en inglés.
     */
    async resolveIsEnglish(interviewId, language) {
        if (language === "en" || language === "english") {
            return true;
        }
        try {
            const interview = await this.interviewRepo.getById(interviewId);
            if (interview &&
                (interview.language === "en" ||
                    interview.language === "english" ||
                    interview.type?.toLowerCase().includes("english"))) {
                return true;
            }
        }
        catch (err) {
            console.warn(`[InterviewEvaluationFacade] No se pudo verificar idioma de entrevista ${interviewId}:`, err?.message);
        }
        return false;
    }
    /**
     * Normaliza los mensajes de la transcripción a formato estructurado de diálogo.
     */
    formatTranscript(transcript, isEnglish) {
        if (typeof transcript === "string" && transcript.trim().length > 0) {
            return transcript;
        }
        const messages = Array.isArray(transcript) ? transcript : [];
        const formatted = messages
            .filter((s) => s && s.content)
            .map((s) => `- ${s.role || "user"}: ${s.content}\n`)
            .join("");
        if (!formatted.trim()) {
            return isEnglish
                ? "- assistant: Welcome to the interview.\n- user: Hello, I am ready."
                : "- assistant: Bienvenido a la entrevista.\n- user: Hola, estoy listo.";
        }
        return formatted;
    }
    /**
     * Ejecuta la evaluación multidimensional de la entrevista con fallback de seguridad.
     */
    async executeTechnicalEvaluation(formattedTranscript, isEnglish) {
        try {
            return await this.aiFacade.evaluateInterview(formattedTranscript, isEnglish);
        }
        catch (err) {
            console.warn("[InterviewEvaluationFacade] Falla en IA, activando fallback de dominio:", err?.message);
            return {
                totalScore: 70,
                categoryScores: [
                    {
                        name: isEnglish ? "Communication Skills" : "Habilidades de Comunicación",
                        score: 70,
                        comment: isEnglish ? "Good initial interaction." : "Buena interacción inicial.",
                    },
                    {
                        name: isEnglish ? "Technical Knowledge" : "Conocimiento Técnico",
                        score: 70,
                        comment: isEnglish ? "Baseline demonstrated." : "Conocimiento base demostrado.",
                    },
                    {
                        name: isEnglish ? "Problem Solving" : "Resolución de Problemas",
                        score: 70,
                        comment: isEnglish ? "Standard approach." : "Enfoque estándar.",
                    },
                    {
                        name: isEnglish ? "Cultural and Role Fit" : "Ajuste Cultural y al Puesto",
                        score: 70,
                        comment: isEnglish ? "Positive attitude." : "Actitud positiva.",
                    },
                    {
                        name: isEnglish ? "Confidence and Clarity" : "Confianza y Claridad",
                        score: 70,
                        comment: isEnglish ? "Clear voice and answers." : "Respuestas claras.",
                    },
                ],
                strengths: [isEnglish ? "Clear voice interaction" : "Interacción de voz clara"],
                areasForImprovement: [
                    isEnglish
                        ? "Provide deeper technical examples in future sessions"
                        : "Profundizar en ejemplos técnicos en futuras sesiones",
                ],
                finalAssessment: isEnglish
                    ? "Interview completed successfully."
                    : "Entrevista completada con éxito.",
            };
        }
    }
    /**
     * Ejecuta la evaluación de inglés CEFR si aplica, sin bloquear en caso de error.
     */
    async executeEnglishEvaluation(formattedTranscript, isEnglish) {
        if (!isEnglish) {
            return null;
        }
        try {
            return await this.aiFacade.evaluateEnglishProficiency(formattedTranscript);
        }
        catch (err) {
            console.warn("[InterviewEvaluationFacade] Error en evaluación lingüística CEFR (ignorado para no bloquear):", err?.message);
            return null;
        }
    }
}
exports.InterviewEvaluationFacade = InterviewEvaluationFacade;
//# sourceMappingURL=interview-evaluation.facade.js.map