import { ICareerVisitor } from "../career-visitor.interface";
import { InterviewSessionElement } from "../elements/interview-session.element";
import { CodeChallengeElement } from "../elements/code-challenge.element";
import { JobApplicationElement } from "../elements/job-application.element";
import { CvAtsAnalysisElement } from "../elements/cv-ats-analysis.element";
export interface SeniorityReadinessReport {
    visitorName: string;
    recommendedLevel: "Junior" | "Mid-Level" | "Senior" | "Lead / Staff";
    overallReadinessScore: number;
    categoryScores: {
        interviewMastery: number;
        codeQuality: number;
        marketAttractiveness: number;
        atsOptimization: number;
    };
    verdict: string;
    criteriaBreakdown: string[];
    analyzedElementsCount: number;
}
/**
 * ============================================================================
 * PATRÓN VISITOR: Visitante Concreto 1 (SeniorityReadinessVisitor)
 * ============================================================================
 * Realiza una auditoría holística de nivel profesional sobre todos los elementos
 * del candidato para dictaminar con qué seniority puede competir en el mercado.
 *
 * Cada método `visit*` evalúa los criterios de su elemento concreto sin acoplar
 * las clases de datos a la lógica de ponderación ni a las reglas de reclutamiento.
 */
export declare class SeniorityReadinessVisitor implements ICareerVisitor {
    readonly visitorName = "SeniorityReadinessVisitor";
    private interviewScores;
    private englishLevels;
    private codeChallengeScores;
    private cyclomaticComplexities;
    private applicationMatchScores;
    private appliedSeniorities;
    private atsScores;
    visitInterview(interview: InterviewSessionElement): void;
    visitCodeChallenge(challenge: CodeChallengeElement): void;
    visitJobApplication(application: JobApplicationElement): void;
    visitCvAts(cvAnalysis: CvAtsAnalysisElement): void;
    /**
     * Genera el reporte consolidado de preparación y recomendación de nivel
     */
    getReport(): SeniorityReadinessReport;
}
