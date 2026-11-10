import { BaseColleague } from "../base.colleague";
import { ICareerMediator } from "../career-mediator.interface";
import { IInterviewRepository } from "../../../repositories/interview.repository";
/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 2: InterviewSessionColleague
 * ============================================================================
 * Gestiona la preparación reactiva de simulacros de entrevista y la actualización
 * del ciclo de vida de las sesiones. Colabora internamente con el patrón Builder
 * sin acoplarse a los módulos de Empleos, Feedback ni Analítica.
 */
export declare class InterviewSessionColleague extends BaseColleague {
    readonly colleagueName = "InterviewSessionColleague";
    private interviewRepo?;
    constructor(interviewRepo?: IInterviewRepository, mediator?: ICareerMediator);
    private getRepo;
    /**
     * Acción invocada por el Mediador cuando una postulación de empleo avanza
     * al estado `"interviewing"`, ensamblando una entrevista simulada a medida.
     */
    prepareInterviewForJobStage(params: {
        userId: string;
        jobTitle: string;
        company: string;
        techstack: string[];
    }): Promise<string>;
    /**
     * Acción invocada por el Mediador cuando se detectan brechas técnicas en el
     * análisis de CV ATS o en la Arena de Retos de Código.
     */
    createTargetedRefresherInterview(params: {
        userId: string;
        targetRole: string;
        missingSkills: string[];
        source: "cv-ats" | "code-challenge";
    }): Promise<string>;
    /**
     * Acción invocada por el Mediador cuando `EvaluationFeedbackColleague`
     * finaliza la evaluación de una entrevista, marcándola como `finalized: true`
     * y recuperando sus metadatos para sincronizar otros colegas.
     */
    finalizeAndGetMetadata(interviewId: string): Promise<{
        role?: string;
        company?: string;
        techstack?: string[];
    } | null>;
}
