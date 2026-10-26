import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";
import { JobApplication } from "../../../types/job.types";
/**
 * ============================================================================
 * PATRÓN BRIDGE — REFINED ABSTRACTION: JobApplicationsReport
 * ============================================================================
 * Estructura el reporte consolidado de postulaciones a empleo de un usuario.
 * Define qué información de seguimiento se presenta (vacantes, métricas,
 * estados, cartas de presentación y CVs adaptados) invocando las primitivas del
 * implementador desacoplado (IReportRenderer).
 */
export declare class JobApplicationsReport extends PerformanceReport {
    private userId;
    private applications;
    constructor(userId: string, applications: JobApplication[], renderer: IReportRenderer);
    protected getTitle(): string;
    protected getBaseFilename(): string;
    protected buildBlocks(): string[];
}
