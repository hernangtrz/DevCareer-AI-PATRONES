import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";
type EnglishFeedback = NonNullable<Feedback["englishFeedback"]>;
/**
 * Refined Abstraction: Reporte de competencia en inglés (marco CEFR A1–C2).
 */
export declare class EnglishProficiencyReport extends PerformanceReport {
    private interviewId;
    private english;
    constructor(interviewId: string, english: EnglishFeedback, renderer: IReportRenderer);
    protected getTitle(): string;
    protected getBaseFilename(): string;
    protected buildBlocks(): string[];
}
export {};
