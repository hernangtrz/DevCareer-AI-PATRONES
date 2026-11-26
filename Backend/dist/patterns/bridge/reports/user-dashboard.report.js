"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDashboardReport = void 0;
const performance_report_abstraction_1 = require("../performance-report.abstraction");
const report_schemas_1 = require("../report-schemas");
/**
 * ============================================================================
 * PATRÓN BRIDGE — REFINED ABSTRACTION: UserDashboardReport
 * ============================================================================
 * Estructura el reporte de analíticas globales y evolución técnica del usuario
 * para ser emitido en cualquier formato (HTML, Markdown, Texto plano) mediante Bridge.
 */
class UserDashboardReport extends performance_report_abstraction_1.PerformanceReport {
    constructor(stats, renderer) {
        super(renderer);
        this.stats = stats;
    }
    getTitle() {
        return `Informe de Rendimiento y Analíticas de ${this.stats.userName} - DevCareer AI`;
    }
    getBaseFilename() {
        return `dashboard-analytics-${this.stats.userId}`;
    }
    buildBlocks() {
        const r = this.renderer;
        const s = report_schemas_1.UserDashboardReportSchema.parse(this.stats);
        const metrics = [
            { label: "Puntaje Promedio General", score: s.averageScore, max: 100 },
            { label: "Habilidades Técnicas y Algoritmos", score: s.technicalScore, max: 100 },
            { label: "Habilidades Blandas y Comunicación", score: s.communicationScore, max: 100 },
        ];
        const status = s.averageScore >= 75 ? "high" : s.averageScore >= 55 ? "mid" : "low";
        const verdictLabel = status === "high"
            ? "Perfil Altamente Competitivo"
            : status === "mid"
                ? "Progreso Sólido en Consolidación"
                : "En Etapa de Construcción";
        const blocks = [];
        if (r.renderExecutiveSummary) {
            blocks.push(r.renderExecutiveSummary({
                score: s.averageScore,
                max: 100,
                verdictLabel,
                verdictSummary: `El candidato ${s.userName} mantiene un promedio global de ${s.averageScore}/100 tras ${s.totalInterviews} sesiones de entrevista simulada y ${s.totalApplications} postulaciones activas.`,
                status,
                badges: [`CEFR ${s.cefrLevel}`, `${s.totalInterviews} entrevistas`, `${s.totalApplications} postulaciones`],
            }));
        }
        const meta = [
            { key: "Desarrollador", value: s.userName },
            { key: "Nivel CEFR de Inglés", value: s.cefrLevel },
            { key: "Entrevistas Completadas", value: String(s.totalInterviews) },
            { key: "Postulaciones Activas", value: String(s.totalApplications) },
        ];
        if (r.renderKeyValueGrid) {
            blocks.push(r.renderKeyValueGrid(meta));
        }
        else {
            meta.forEach((m) => blocks.push(r.renderKeyValue(m.key, m.value)));
        }
        if (r.renderChartSummary) {
            blocks.push(r.renderChartSummary("Métricas Generales de Preparación", metrics));
        }
        blocks.push(r.renderSection("Detalle de Pilares Evaluados"));
        metrics.forEach((m) => blocks.push(r.renderScore(m.label, m.score, m.max)));
        blocks.push(r.renderSection("Principales Fortalezas"));
        const strengths = s.topStrengths.length > 0
            ? s.topStrengths
            : ["Dominio de TypeScript y React", "Diseño de APIs REST"];
        blocks.push(r.renderListWithTone ? r.renderListWithTone(strengths, "positive") : r.renderList(strengths));
        blocks.push(r.renderSection("Oportunidades de Crecimiento"));
        const improvements = s.keyImprovements.length > 0
            ? s.keyImprovements
            : ["Profundizar en patrones de concurrencia", "Optimizar complejidad Big-O en algoritmos"];
        blocks.push(r.renderListWithTone
            ? r.renderListWithTone(improvements, "improvement")
            : r.renderList(improvements));
        blocks.push(r.renderSection("Dictamen del Mentor de IA"));
        blocks.push(r.renderParagraph(`El candidato ha mantenido un desempeño del ${s.averageScore}% a través de ${s.totalInterviews} sesiones de entrevista simulada. Su perfil presenta alta competitividad para posiciones de desarrollo de software internacional.`));
        return blocks;
    }
}
exports.UserDashboardReport = UserDashboardReport;
//# sourceMappingURL=user-dashboard.report.js.map