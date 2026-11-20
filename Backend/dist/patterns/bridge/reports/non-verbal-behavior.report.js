"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonVerbalBehaviorReport = void 0;
const performance_report_abstraction_1 = require("../performance-report.abstraction");
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL BRIDGE (GoF): NonVerbalBehaviorReport
 * ============================================================================
 * Refined Abstraction: Reporte especializado en lenguaje corporal, FACS,
 * micro-expresiones faciales, estabilidad postural y contacto visual.
 * Desacoplado de la implementación de renderizado (HTML, Markdown, PlainText).
 */
class NonVerbalBehaviorReport extends performance_report_abstraction_1.PerformanceReport {
    constructor(interviewId, facial, renderer) {
        super(renderer);
        this.interviewId = interviewId;
        this.facial = facial;
    }
    getTitle() {
        return "Reporte de Comportamiento No Verbal & Presencia Ejecutiva - DevCareer AI";
    }
    getBaseFilename() {
        return `feedback-conductual-${this.interviewId}`;
    }
    buildBlocks() {
        const r = this.renderer;
        const f = this.facial;
        const m = f.metrics;
        return [
            r.renderKeyValue("Entrevista", this.interviewId),
            r.renderKeyValue("Perfil Expresivo", f.expressiveProfile),
            r.renderKeyValue("Tasa de Parpadeo", `${m.blinkRatePerMin} / minuto`),
            r.renderKeyValue("Presencia en Encuadre", `${m.facePresencePercent}% de la sesión`),
            r.renderSection("Puntaje Global de Presencia"),
            r.renderScore("Presencia No Verbal", f.overallScore, 100),
            r.renderSection("Dimensiones Conductuales Evaluadas"),
            r.renderScore("Contacto Visual con la Cámara", m.eyeContact, 100),
            r.renderScore("Control de Tensión y Serenidad", m.composure, 100),
            r.renderScore("Equilibrio y Expresividad Gestual", m.gestureBalance, 100),
            r.renderScore("Estabilidad Postural", m.postureStability, 100),
            r.renderScore("Calidez y Conexión Emocional", m.warmth, 100),
            r.renderSection("Diagnóstico del Coach IA"),
            r.renderParagraph(f.summaryComment || ""),
            r.renderSection("Fortalezas Observadas"),
            r.renderList(f.strengths || []),
            r.renderSection("Hábitos a Mejorar"),
            r.renderList(f.habitsToImprove || []),
            r.renderSection("Plan de Micro-Ejercicios Prácticos"),
            r.renderList(f.coachingTips || []),
        ];
    }
}
exports.NonVerbalBehaviorReport = NonVerbalBehaviorReport;
//# sourceMappingURL=non-verbal-behavior.report.js.map