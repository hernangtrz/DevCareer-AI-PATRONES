import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";
export interface InterviewReportContext {
    candidateName?: string;
    role?: string;
    company?: string;
    level?: string;
    interviewType?: string;
    techstack?: string[];
}
/**
 * Refined Abstraction: Reporte ejecutivo de desempeño de entrevista
 * (resumen ejecutivo + contexto del rol + gráficos de 5 competencias + fortalezas + plan de mejora).
 */
export declare class InterviewFeedbackReport extends PerformanceReport {
    private feedback;
    private context?;
    constructor(feedback: Feedback, renderer: IReportRenderer, context?: InterviewReportContext);
    protected getTitle(): string;
    protected getBaseFilename(): string;
    protected buildBlocks(): string[];
}
