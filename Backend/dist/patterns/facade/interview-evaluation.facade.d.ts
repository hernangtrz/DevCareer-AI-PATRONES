import { Feedback } from "../../types";
import { IInterviewRepository } from "../../repositories/interview.repository";
import { IFeedbackRepository } from "../../repositories/feedback.repository";
import { AIServiceFacade } from "./ai-service.facade";
export interface ProcessInterviewEvaluationInput {
    interviewId: string;
    userId: string;
    transcript: Array<{
        role?: string;
        content?: string;
    }> | string;
    language?: string;
}
export interface EvaluationProcessResult {
    feedbackId: string;
    feedback: Feedback;
}
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
export declare class InterviewEvaluationFacade {
    private aiFacade;
    private interviewRepo;
    private feedbackRepo;
    constructor(aiFacade?: AIServiceFacade, interviewRepo?: IInterviewRepository, feedbackRepo?: IFeedbackRepository);
    /**
     * Orquesta todo el flujo de generación y almacenamiento del feedback de una entrevista.
     * Encapsula los fallbacks resilientes de dominio y la concurrencia en segundo plano.
     */
    processAndSaveEvaluation(input: ProcessInterviewEvaluationInput): Promise<EvaluationProcessResult>;
    /**
     * Resuelve si la entrevista debe ser evaluada en inglés.
     */
    private resolveIsEnglish;
    /**
     * Normaliza los mensajes de la transcripción a formato estructurado de diálogo.
     */
    private formatTranscript;
    /**
     * Ejecuta la evaluación multidimensional de la entrevista con fallback de seguridad.
     */
    private executeTechnicalEvaluation;
    /**
     * Ejecuta la evaluación de inglés CEFR si aplica, sin bloquear en caso de error.
     */
    private executeEnglishEvaluation;
}
