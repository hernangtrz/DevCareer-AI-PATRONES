import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";
import { InterviewReportContext } from "./interview-feedback.report";
type FacialFeedback = NonNullable<Feedback["facialFeedback"]>;
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL BRIDGE (GoF): NonVerbalBehaviorReport
 * ============================================================================
 * Refined Abstraction: Reporte ejecutivo de lenguaje corporal, micro-expresiones,
 * estabilidad postural y contacto visual durante la entrevista.
 */
export declare class NonVerbalBehaviorReport extends PerformanceReport {
    private interviewId;
    private facial;
    private context?;
    constructor(interviewId: string, facial: FacialFeedback, renderer: IReportRenderer, context?: InterviewReportContext);
    protected getTitle(): string;
    protected getBaseFilename(): string;
    protected buildBlocks(): string[];
}
export {};
