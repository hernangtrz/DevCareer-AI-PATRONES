import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";
import { InterviewReportContext } from "./interview-feedback.report";
type EnglishFeedback = NonNullable<Feedback["englishFeedback"]>;
/**
 * Refined Abstraction: Reporte ejecutivo de competencia en inglés (marco CEFR A1–C2).
 */
export declare class EnglishProficiencyReport extends PerformanceReport {
    private interviewId;
    private english;
    private context?;
    constructor(interviewId: string, english: EnglishFeedback, renderer: IReportRenderer, context?: InterviewReportContext);
    protected getTitle(): string;
    protected getBaseFilename(): string;
    protected buildBlocks(): string[];
}
export {};
