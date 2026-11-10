import { BaseColleague } from "../base.colleague";
import { ICareerMediator } from "../career-mediator.interface";
export interface ReadinessAlert {
    id: string;
    userId: string;
    severity: "high" | "medium" | "low";
    category: string;
    message: string;
    recommendedAction: string;
    createdAt: string;
}
export interface CoordinatedMilestone {
    id: string;
    userId: string;
    type: "application" | "interview_stage" | "evaluation" | "skill_gap";
    summary: string;
    score?: number;
    timestamp: string;
}
/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 4: CandidateAnalyticsColleague
 * ============================================================================
 * Gestiona el registro de hitos transversales y alertas proactivas de puntos
 * ciegos (blindspots) del candidato en respuesta a las coordinaciones del Mediador.
 */
export declare class CandidateAnalyticsColleague extends BaseColleague {
    readonly colleagueName = "CandidateAnalyticsColleague";
    private alertsByUser;
    private milestonesByUser;
    constructor(mediator?: ICareerMediator);
    /**
     * Invocado por el Mediador para registrar un hito transversal de actividad.
     */
    recordMilestone(params: {
        userId: string;
        type: CoordinatedMilestone["type"];
        summary: string;
        score?: number;
    }): CoordinatedMilestone;
    /**
     * Invocado por el Mediador cuando una evaluación de entrevista o análisis técnico
     * revela áreas de mejora críticas o puntajes por debajo del objetivo.
     */
    registerEvaluationInsights(params: {
        userId: string;
        interviewId: string;
        totalScore: number;
        cefrLevel?: string;
        areasForImprovement: string[];
        role?: string;
    }): ReadinessAlert[];
    /**
     * Invocado por el Mediador cuando se detectan palabras clave faltantes en CV ATS
     * o fallos de principios SOLID en retos de código.
     */
    registerSkillGapAlert(params: {
        userId: string;
        source: "cv-ats" | "code-challenge";
        targetRole: string;
        missingSkills: string[];
        score: number;
    }): ReadinessAlert;
    getAlertsForUser(userId: string): ReadinessAlert[];
    getMilestonesForUser(userId: string): CoordinatedMilestone[];
}
