import { ICareerVisitor } from "../career-visitor.interface";
import { InterviewSessionElement } from "../elements/interview-session.element";
import { CodeChallengeElement } from "../elements/code-challenge.element";
import { JobApplicationElement } from "../elements/job-application.element";
import { CvAtsAnalysisElement } from "../elements/cv-ats-analysis.element";
export interface BlindspotItem {
    elementId: string;
    sourceType: "interview" | "code_challenge" | "job_application" | "cv_ats";
    severity: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    issue: string;
    recommendation: string;
}
export interface BlindspotReport {
    visitorName: string;
    totalBlindspots: number;
    highSeverityCount: number;
    blindspots: BlindspotItem[];
    actionPlan: string[];
}
/**
 * ============================================================================
 * PATRÓN VISITOR: Visitante Concreto 2 (BlindspotDetectionVisitor)
 * ============================================================================
 * Inspecciona minuciosamente cada elemento para extraer fallas ocultas,
 * debilidades o inconsistencias (puntos ciegos) que descalifican al candidato.
 */
export declare class BlindspotDetectionVisitor implements ICareerVisitor {
    readonly visitorName = "BlindspotDetectionVisitor";
    private blindspots;
    visitInterview(interview: InterviewSessionElement): void;
    visitCodeChallenge(challenge: CodeChallengeElement): void;
    visitJobApplication(application: JobApplicationElement): void;
    visitCvAts(cvAnalysis: CvAtsAnalysisElement): void;
    /**
     * Genera el reporte estructurado de puntos ciegos y plan de acción prioritario
     */
    getReport(): BlindspotReport;
}
