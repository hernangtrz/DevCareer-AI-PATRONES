import { BaseColleague } from "./base.colleague";
/**
 * Eventos de dominio soportados por el Mediador de Flujo Profesional (GoF Mediator).
 */
export type CareerDomainEvent = "JOB_APPLIED" | "APPLICATION_STATUS_CHANGED" | "INTERVIEW_EVALUATED" | "SKILL_GAP_DETECTED";
/**
 * Mapa tipado de payloads para cada evento de dominio coordinado por el Mediador.
 */
export interface CareerEventPayloadMap {
    JOB_APPLIED: {
        userId: string;
        applicationId: string;
        jobId: string;
        jobTitle: string;
        company: string;
        techstack: string[];
        matchScore?: number;
    };
    APPLICATION_STATUS_CHANGED: {
        userId: string;
        applicationId: string;
        newStatus: "applied" | "interviewing" | "offered" | "rejected";
        jobTitle?: string;
        company?: string;
        techstack?: string[];
    };
    INTERVIEW_EVALUATED: {
        interviewId: string;
        feedbackId: string;
        userId: string;
        totalScore: number;
        cefrLevel?: string;
        strengths: string[];
        areasForImprovement: string[];
        role?: string;
        company?: string;
    };
    SKILL_GAP_DETECTED: {
        userId: string;
        source: "cv-ats" | "code-challenge";
        targetRole: string;
        missingSkills: string[];
        score: number;
    };
}
/**
 * Registro auditable de cada acción de coordinación ejecutada por el Mediador.
 */
export interface MediatorActionLog {
    id: string;
    timestamp: string;
    senderColleague: string;
    event: CareerDomainEvent;
    targetColleagues: string[];
    actionsExecuted: string[];
    metadata?: Record<string, any>;
}
/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL MEDIATOR (GoF): ICareerMediator
 * ============================================================================
 * Define el contrato de comunicación centralizada para desacoplar los módulos
 * pares del ecosistema DevCareer AI (Postulaciones, Entrevistas, Evaluación
 * y Analítica de Empleabilidad).
 *
 * A diferencia de Facade (unidireccional), el Mediator gestiona interacciones
 * multidireccionales entre objetos colegas (Colleagues) evitando referencias
 * cruzadas directas N x (N - 1).
 */
export interface ICareerMediator {
    notify<E extends CareerDomainEvent>(sender: BaseColleague, event: E, payload: CareerEventPayloadMap[E]): Promise<void>;
    getCoordinationLogs(): MediatorActionLog[];
    clearLogs(): void;
}
