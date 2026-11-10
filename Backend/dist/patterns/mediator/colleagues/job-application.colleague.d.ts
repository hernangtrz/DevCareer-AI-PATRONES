import { BaseColleague } from "../base.colleague";
import { ICareerMediator } from "../career-mediator.interface";
import { IJobApplicationRepository } from "../../../repositories/job-application.repository";
import { JobApplication } from "../../../types/job.types";
/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 1: JobApplicationColleague
 * ============================================================================
 * Gestiona eventos y reacciones sobre las postulaciones de empleo del candidato.
 * No tiene conocimiento directo de Entrevistas, Evaluaciones ni Analítica;
 * toda coordinación transversal ocurre exclusivamente a través de `ICareerMediator`.
 */
export declare class JobApplicationColleague extends BaseColleague {
    private appRepo;
    readonly colleagueName = "JobApplicationColleague";
    constructor(appRepo?: IJobApplicationRepository, mediator?: ICareerMediator);
    /**
     * Dispara la notificación cuando el candidato registra una nueva postulación.
     */
    notifyJobApplied(application: JobApplication): Promise<void>;
    /**
     * Actualiza el estado de una postulación y notifica al Mediador para que
     * coordine reacciones en otros módulos (ej. preparar simulacro si pasa a 'interviewing').
     */
    changeStatusAndNotify(applicationId: string, userId: string, newStatus: JobApplication["status"]): Promise<JobApplication | null>;
    /**
     * Acción invocada por el Mediador cuando `InterviewSessionColleague` prepara
     * un simulacro automático para una postulación que pasó a etapa de entrevista.
     */
    attachPreparedInterviewNote(applicationId: string, interviewId: string, jobTitle: string): Promise<boolean>;
    /**
     * Acción invocada por el Mediador cuando `EvaluationFeedbackColleague` concluye
     * la calificación de una entrevista vinculada a una empresa/rol postulado.
     */
    syncEvaluationResultWithApplication(params: {
        userId: string;
        interviewId: string;
        score: number;
        cefrLevel?: string;
        company?: string;
        role?: string;
    }): Promise<string | null>;
}
