import { BaseColleague } from "./base.colleague";
import { ICareerMediator, CareerDomainEvent, CareerEventPayloadMap, MediatorActionLog } from "./career-mediator.interface";
import { JobApplicationColleague } from "./colleagues/job-application.colleague";
import { InterviewSessionColleague } from "./colleagues/interview-session.colleague";
import { EvaluationFeedbackColleague } from "./colleagues/evaluation-feedback.colleague";
import { CandidateAnalyticsColleague } from "./colleagues/candidate-analytics.colleague";
/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL MEDIATOR (GoF): CareerWorkflowMediator
 * ============================================================================
 * Mediador concreto que centraliza la comunicación multidireccional entre los
 * 4 colegas del dominio de empleabilidad:
 *  1. `JobApplicationColleague`     (Seguimiento de postulaciones)
 *  2. `InterviewSessionColleague`   (Preparación y estado de entrevistas)
 *  3. `EvaluationFeedbackColleague` (Diagnóstico de IA, puntajes y CEFR)
 *  4. `CandidateAnalyticsColleague` (Hitos de progreso y alertas de brechas)
 *
 * Beneficios arquitectónicos:
 *  - Convierte una malla de dependencias N x (N - 1) en una topología estrella.
 *  - Cumple SRP y OCP: cada colega se enfoca en su responsabilidad única y el
 *    mediador encapsula las reglas de reacción transversal entre módulos.
 */
export declare class CareerWorkflowMediator implements ICareerMediator {
    readonly jobColleague: JobApplicationColleague;
    readonly interviewColleague: InterviewSessionColleague;
    readonly feedbackColleague: EvaluationFeedbackColleague;
    readonly analyticsColleague: CandidateAnalyticsColleague;
    private coordinationLogs;
    private lastPreparedInterviewId;
    constructor(jobColleague?: JobApplicationColleague, interviewColleague?: InterviewSessionColleague, feedbackColleague?: EvaluationFeedbackColleague, analyticsColleague?: CandidateAnalyticsColleague);
    /**
     * Recibe notificaciones de cualquier colega y orquesta las reacciones
     * correspondientes en los demás colegas sin que ellos se conozcan entre sí.
     */
    notify<E extends CareerDomainEvent>(sender: BaseColleague, event: E, payload: CareerEventPayloadMap[E]): Promise<void>;
    getLastPreparedInterviewId(): string | null;
    getCoordinationLogs(): MediatorActionLog[];
    clearLogs(): void;
}
export declare function getDefaultCareerMediator(): CareerWorkflowMediator;
