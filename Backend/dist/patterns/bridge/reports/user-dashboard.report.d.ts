import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";
export interface DashboardStatsData {
    userId: string;
    userName: string;
    totalInterviews: number;
    averageScore: number;
    technicalScore: number;
    communicationScore: number;
    cefrLevel: string;
    topStrengths: string[];
    keyImprovements: string[];
    totalApplications: number;
}
/**
 * ============================================================================
 * PATRÓN BRIDGE — REFINED ABSTRACTION: UserDashboardReport
 * ============================================================================
 * Estructura el reporte de analíticas globales y evolución técnica del usuario
 * para ser emitido en cualquier formato (HTML, Markdown, Texto plano) mediante Bridge.
 */
export declare class UserDashboardReport extends PerformanceReport {
    private stats;
    constructor(stats: DashboardStatsData, renderer: IReportRenderer);
    protected getTitle(): string;
    protected getBaseFilename(): string;
    protected buildBlocks(): string[];
}
