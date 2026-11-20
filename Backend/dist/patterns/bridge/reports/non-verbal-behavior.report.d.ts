import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";
type FacialFeedback = NonNullable<Feedback["facialFeedback"]>;
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL BRIDGE (GoF): NonVerbalBehaviorReport
 * ============================================================================
 * Refined Abstraction: Reporte especializado en lenguaje corporal, FACS,
 * micro-expresiones faciales, estabilidad postural y contacto visual.
 * Desacoplado de la implementación de renderizado (HTML, Markdown, PlainText).
 */
export declare class NonVerbalBehaviorReport extends PerformanceReport {
    private interviewId;
    private facial;
    constructor(interviewId: string, facial: FacialFeedback, renderer: IReportRenderer);
    protected getTitle(): string;
    protected getBaseFilename(): string;
    protected buildBlocks(): string[];
}
export {};
