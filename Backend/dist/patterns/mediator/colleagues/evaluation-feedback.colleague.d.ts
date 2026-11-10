import { BaseColleague } from "../base.colleague";
import { ICareerMediator } from "../career-mediator.interface";
import { Feedback } from "../../../types";
/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 3: EvaluationFeedbackColleague
 * ============================================================================
 * Representa al módulo de Evaluación de IA y Diagnóstico de Competencias.
 * Emite eventos hacia el Mediador cuando una entrevista o diagnóstico técnico
 * ha sido calificado, sin conocer ni depender de los módulos de Postulaciones,
 * Entrevistas o Analítica.
 */
export declare class EvaluationFeedbackColleague extends BaseColleague {
    readonly colleagueName = "EvaluationFeedbackColleague";
    constructor(mediator?: ICareerMediator);
    /**
     * Notifica al Mediador que una entrevista ha sido evaluada exitosamente
     * para desencadenar la sincronización transversal del ecosistema.
     */
    notifyEvaluationCompleted(params: {
        feedbackId: string;
        feedback: Feedback;
        role?: string;
        company?: string;
    }): Promise<void>;
    /**
     * Notifica al Mediador cuando un análisis de CV ATS o un Reto de Código
     * detecta brechas técnicas que requieren entrenamiento focalizado.
     */
    notifySkillGapDetected(params: {
        userId: string;
        source: "cv-ats" | "code-challenge";
        targetRole: string;
        missingSkills: string[];
        score: number;
    }): Promise<void>;
}
