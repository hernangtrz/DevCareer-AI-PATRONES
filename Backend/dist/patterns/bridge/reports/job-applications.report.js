"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationsReport = void 0;
const performance_report_abstraction_1 = require("../performance-report.abstraction");
/**
 * ============================================================================
 * PATRÓN BRIDGE — REFINED ABSTRACTION: JobApplicationsReport
 * ============================================================================
 * Estructura el reporte consolidado de postulaciones a empleo de un usuario.
 * Define qué información de seguimiento se presenta (vacantes, métricas,
 * estados, cartas de presentación y CVs adaptados) invocando las primitivas del
 * implementador desacoplado (IReportRenderer).
 */
class JobApplicationsReport extends performance_report_abstraction_1.PerformanceReport {
    constructor(userId, applications, renderer) {
        super(renderer);
        this.userId = userId;
        this.applications = applications;
    }
    getTitle() {
        return "Reporte Consolidado de Postulaciones Laborales - DevCareer AI";
    }
    getBaseFilename() {
        return `postulaciones-${this.userId}-${new Date().toISOString().slice(0, 10)}`;
    }
    buildBlocks() {
        const r = this.renderer;
        const apps = this.applications;
        const total = apps.length;
        const applied = apps.filter((a) => a.status === "applied").length;
        const interviewing = apps.filter((a) => a.status === "interviewing").length;
        const offered = apps.filter((a) => a.status === "offered").length;
        const blocks = [
            r.renderKeyValue("Total de Postulaciones", total.toString()),
            r.renderKeyValue("Fecha de Emisión", new Date().toLocaleString("es-CO")),
            r.renderSection("Resumen del Embudo de Selección"),
            r.renderScore("Postuladas", applied, total || 1, `${applied} vacantes en espera de respuesta`),
            r.renderScore("En Entrevistas", interviewing, total || 1, `${interviewing} procesos activos`),
            r.renderScore("Ofertas Recibidas", offered, total || 1, `${offered} ofertas finales`),
            r.renderSection("Detalle de Vacantes Aplicadas"),
        ];
        if (apps.length === 0) {
            blocks.push(r.renderParagraph("No hay postulaciones registradas en este período."));
            return blocks;
        }
        for (const app of apps) {
            const date = new Date(app.appliedAt).toLocaleDateString("es-CO");
            blocks.push(r.renderSection(`${app.jobTitle} - ${app.company}`), r.renderKeyValue("Plataforma", app.platform), r.renderKeyValue("Ubicación", app.location), r.renderKeyValue("Fecha de Postulación", date), r.renderKeyValue("Estado Actual", app.status.toUpperCase()), r.renderKeyValue("Compatibilidad (Match Score)", `${app.matchScore || 85}%`));
            if (app.adaptedResumeSummary) {
                blocks.push(r.renderKeyValue("Hoja de Vida Adaptada", app.adaptedResumeSummary));
            }
            if (app.coverLetter) {
                blocks.push(r.renderKeyValue("Carta de Presentación Enviada", "Sí (Ver extracto abajo)"), r.renderParagraph(app.coverLetter));
            }
        }
        return blocks;
    }
}
exports.JobApplicationsReport = JobApplicationsReport;
//# sourceMappingURL=job-applications.report.js.map