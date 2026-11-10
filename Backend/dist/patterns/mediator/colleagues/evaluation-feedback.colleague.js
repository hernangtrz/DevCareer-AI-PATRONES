"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationFeedbackColleague = void 0;
const base_colleague_1 = require("../base.colleague");
/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 3: EvaluationFeedbackColleague
 * ============================================================================
 * Representa al módulo de Evaluación de IA y Diagnóstico de Competencias.
 * Emite eventos hacia el Mediador cuando una entrevista o diagnóstico técnico
 * ha sido calificado, sin conocer ni depender de los módulos de Postulaciones,
 * Entrevistas o Analítica.
 */
class EvaluationFeedbackColleague extends base_colleague_1.BaseColleague {
    constructor(mediator) {
        super(mediator);
        this.colleagueName = "EvaluationFeedbackColleague";
    }
    /**
     * Notifica al Mediador que una entrevista ha sido evaluada exitosamente
     * para desencadenar la sincronización transversal del ecosistema.
     */
    async notifyEvaluationCompleted(params) {
        const { feedbackId, feedback, role, company } = params;
        await this.emit("INTERVIEW_EVALUATED", {
            interviewId: feedback.interviewId,
            feedbackId,
            userId: feedback.userId,
            totalScore: feedback.totalScore,
            cefrLevel: feedback.englishFeedback?.overallLevel,
            strengths: feedback.strengths || [],
            areasForImprovement: feedback.areasForImprovement || [],
            role,
            company,
        });
    }
    /**
     * Notifica al Mediador cuando un análisis de CV ATS o un Reto de Código
     * detecta brechas técnicas que requieren entrenamiento focalizado.
     */
    async notifySkillGapDetected(params) {
        await this.emit("SKILL_GAP_DETECTED", params);
    }
}
exports.EvaluationFeedbackColleague = EvaluationFeedbackColleague;
//# sourceMappingURL=evaluation-feedback.colleague.js.map