"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonVerbalBehaviorReport = void 0;
const performance_report_abstraction_1 = require("../performance-report.abstraction");
const report_schemas_1 = require("../report-schemas");
function interpretBlinkRate(rate) {
    if (rate <= 0)
        return "No medido";
    if (rate >= 10 && rate <= 22)
        return `${rate} / min (rango natural y relajado)`;
    if (rate > 22)
        return `${rate} / min (ligeramente elevado — señal de tensión)`;
    return `${rate} / min (bajo — alta concentración fija)`;
}
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL BRIDGE (GoF): NonVerbalBehaviorReport
 * ============================================================================
 * Refined Abstraction: Reporte ejecutivo de lenguaje corporal, micro-expresiones,
 * estabilidad postural y contacto visual durante la entrevista.
 */
class NonVerbalBehaviorReport extends performance_report_abstraction_1.PerformanceReport {
    constructor(interviewId, facial, renderer, context) {
        super(renderer);
        this.interviewId = interviewId;
        this.facial = facial;
        this.context = context;
    }
    getTitle() {
        return "Reporte de Presencia Ejecutiva & Lenguaje No Verbal — DevCareer AI";
    }
    getBaseFilename() {
        return `feedback-conductual-${this.interviewId}`;
    }
    buildBlocks() {
        const r = this.renderer;
        const f = report_schemas_1.FacialFeedbackReportSchema.parse(this.facial);
        const m = f.metrics;
        const ctx = report_schemas_1.InterviewReportContextSchema.parse(this.context);
        const status = f.overallScore >= 78 ? "high" : f.overallScore >= 58 ? "mid" : "low";
        const verdictLabel = status === "high"
            ? "Presencia Ejecutiva Sólida"
            : status === "mid"
                ? "Presencia Equilibrada · Con Ajustes Clave"
                : "Presencia a Reforzar en Cámara";
        const dimensions = [
            {
                label: "Contacto Visual con la Cámara",
                score: m.eyeContact,
                max: 100,
                comment: "Mantiene la mirada dirigida al entrevistador y proyecta seguridad.",
            },
            {
                label: "Serenidad y Control de Tensión",
                score: m.composure,
                max: 100,
                comment: "Manejo calmado ante preguntas complejas sin micro-tensión excesiva.",
            },
            {
                label: "Equilibrio Gestual",
                score: m.gestureBalance,
                max: 100,
                comment: "Naturalidad en las expresiones faciales acompañando el discurso.",
            },
            {
                label: "Estabilidad Postural",
                score: m.postureStability,
                max: 100,
                comment: "Encuadre erguido y estable durante toda la sesión en video.",
            },
            {
                label: "Calidez y Conexión",
                score: m.warmth,
                max: 100,
                comment: "Cercanía, amabilidad y disposición colaborativa percibida.",
            },
        ];
        const highlight = {
            score: f.overallScore,
            max: 100,
            verdictLabel,
            verdictSummary: f.summaryComment ||
                `Tu perfil expresivo se clasificó como "${f.expressiveProfile}", manteniendo presencia en encuadre durante el ${m.facePresencePercent}% de la entrevista.`,
            status,
            badges: [
                f.expressiveProfile,
                `Encuadre ${m.facePresencePercent}%`,
                ...(ctx?.role ? [ctx.role] : []),
            ],
        };
        const metaItems = [
            ...(ctx?.candidateName ? [{ key: "Candidato", value: ctx.candidateName }] : []),
            ...(ctx?.role ? [{ key: "Rol Evaluado", value: ctx.role }] : []),
            { key: "Perfil Expresivo", value: f.expressiveProfile },
            { key: "Presencia en Encuadre", value: `${m.facePresencePercent}% de la sesión` },
            { key: "Tasa de Parpadeo", value: interpretBlinkRate(m.blinkRatePerMin) },
            { key: "ID de Entrevista", value: this.interviewId },
        ];
        const blocks = [];
        if (r.renderExecutiveSummary) {
            blocks.push(r.renderExecutiveSummary(highlight));
        }
        else {
            blocks.push(r.renderSection("Puntaje Global de Presencia"));
            blocks.push(r.renderScore("Presencia No Verbal", f.overallScore, 100));
        }
        if (r.renderKeyValueGrid) {
            blocks.push(r.renderKeyValueGrid(metaItems));
        }
        else {
            metaItems.forEach((item) => blocks.push(r.renderKeyValue(item.key, item.value)));
        }
        if (r.renderChartSummary) {
            blocks.push(r.renderChartSummary("Panorama Visual de Dimensiones Conductuales", dimensions));
        }
        blocks.push(r.renderSection("Detalle de Dimensiones Conductuales"));
        dimensions.forEach((d) => blocks.push(r.renderScore(d.label, d.score, d.max, d.comment)));
        blocks.push(r.renderSection("Fortalezas Observadas en Cámara"));
        blocks.push(r.renderListWithTone
            ? r.renderListWithTone(f.strengths || [], "positive")
            : r.renderList(f.strengths || []));
        blocks.push(r.renderSection("Hábitos a Corregir"));
        blocks.push(r.renderListWithTone
            ? r.renderListWithTone(f.habitsToImprove || [], "improvement")
            : r.renderList(f.habitsToImprove || []));
        blocks.push(r.renderSection("Plan de Micro-Ejercicios Prácticos"));
        blocks.push(r.renderListWithTone
            ? r.renderListWithTone(f.coachingTips || [], "action")
            : r.renderList(f.coachingTips || []));
        blocks.push(r.renderSection("Diagnóstico del Coach IA"));
        blocks.push(r.renderParagraph(f.summaryComment || ""));
        return blocks;
    }
}
exports.NonVerbalBehaviorReport = NonVerbalBehaviorReport;
//# sourceMappingURL=non-verbal-behavior.report.js.map