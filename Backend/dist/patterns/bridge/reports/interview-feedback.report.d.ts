import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";
/**
 * Refined Abstraction: Reporte de desempeño de la entrevista (puntaje global + 5 categorías).
 */
export declare class InterviewFeedbackReport extends PerformanceReport {
    private feedback;
    constructor(feedback: Feedback, renderer: IReportRenderer);
    protected getTitle(): string;
    protected getBaseFilename(): string;
    protected buildBlocks(): string[];
}
