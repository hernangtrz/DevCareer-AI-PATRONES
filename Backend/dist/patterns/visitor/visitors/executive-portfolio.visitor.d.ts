import { ICareerVisitor } from "../career-visitor.interface";
import { InterviewSessionElement } from "../elements/interview-session.element";
import { CodeChallengeElement } from "../elements/code-challenge.element";
import { JobApplicationElement } from "../elements/job-application.element";
import { CvAtsAnalysisElement } from "../elements/cv-ats-analysis.element";
export interface ExecutivePortfolioSummary {
    visitorName: string;
    candidateSummary: string;
    totalInterviews: number;
    averageInterviewScore: number;
    topCefrLevel: string;
    challengesCompleted: number;
    codePassRate: number;
    activeApplicationsCount: number;
    topMatchedSkills: string[];
    portfolioHighlights: string[];
    readyForExport: boolean;
}
/**
 * ============================================================================
 * PATRÓN VISITOR: Visitante Concreto 3 (ExecutivePortfolioVisitor)
 * ============================================================================
 * Transforma y consolida los elementos heterogéneos del candidato en un
 * dossier ejecutivo de alto impacto, formateado para presentación ante reclutadores.
 */
export declare class ExecutivePortfolioVisitor implements ICareerVisitor {
    readonly visitorName = "ExecutivePortfolioVisitor";
    private interviewsCount;
    private interviewScores;
    private cefrLevels;
    private challengesCount;
    private challengePassRates;
    private masteredLanguages;
    private applicationsCount;
    private activePipelineCompanies;
    private skillsSet;
    private atsScores;
    private targetRoles;
    visitInterview(interview: InterviewSessionElement): void;
    visitCodeChallenge(challenge: CodeChallengeElement): void;
    visitJobApplication(application: JobApplicationElement): void;
    visitCvAts(cvAnalysis: CvAtsAnalysisElement): void;
    /**
     * Genera el resumen consolidado para el portafolio ejecutivo
     */
    getSummary(): ExecutivePortfolioSummary;
}
