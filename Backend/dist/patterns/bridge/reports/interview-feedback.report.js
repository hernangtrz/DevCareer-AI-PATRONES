"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewFeedbackReport = void 0;
const performance_report_abstraction_1 = require("../performance-report.abstraction");
/**
 * Refined Abstraction: Reporte de desempeño de la entrevista (puntaje global + 5 categorías).
 */
class InterviewFeedbackReport extends performance_report_abstraction_1.PerformanceReport {
    constructor(feedback, renderer) {
        super(renderer);
        this.feedback = feedback;
    }
    getTitle() {
        return "Reporte de Desempeño - Entrevista DevCareer AI";
    }
    getBaseFilename() {
        return `feedback-entrevista-${this.feedback.interviewId}`;
    }
    buildBlocks() {
        const r = this.renderer;
        const f = this.feedback;
        const date = f.createdAt ? new Date(f.createdAt).toLocaleString("es-CO") : "N/D";
        return [
            r.renderKeyValue("Entrevista", f.interviewId),
            r.renderKeyValue("Fecha", date),
            r.renderSection("Puntaje Global"),
            r.renderScore("Total", f.totalScore, 100),
            r.renderSection("Evaluación por Categorías"),
            ...(f.categoryScores || []).map((c) => r.renderScore(c.name, c.score, 100, c.comment)),
            r.renderSection("Fortalezas"),
            r.renderList(f.strengths || []),
            r.renderSection("Áreas de Mejora"),
            r.renderList(f.areasForImprovement || []),
            r.renderSection("Dictamen Final"),
            r.renderParagraph(f.finalAssessment || ""),
        ];
    }
}
exports.InterviewFeedbackReport = InterviewFeedbackReport;
//# sourceMappingURL=interview-feedback.report.js.map