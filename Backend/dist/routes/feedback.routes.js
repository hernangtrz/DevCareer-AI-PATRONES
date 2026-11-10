"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feedback_service_1 = require("../services/feedback.service");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const facade_1 = require("../patterns/facade");
const analytics_service_1 = require("../services/analytics.service");
const bridge_1 = require("../patterns/bridge");
const mediator_1 = require("../patterns/mediator");
const router = (0, express_1.Router)();
const interviewEvaluationFacade = new facade_1.InterviewEvaluationFacade();
const careerMediator = (0, mediator_1.getDefaultCareerMediator)();
/**
 * Middleware de autenticación flexible:
 * Permite token Bearer, cookie de sesión o fallback a usuario demo para exports del navegador.
 */
// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/user/analytics-summary - Resumen consolidado para Analytics
// ──────────────────────────────────────────────────────────────────────────────
router.get("/user/analytics-summary", auth_middleware_1.flexibleAuth, async (req, res) => {
    try {
        const userId = req.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f";
        const summary = await (0, analytics_service_1.calculateRealUserAnalytics)(userId);
        res.status(200).json({
            success: true,
            summary,
        });
    }
    catch (error) {
        console.error("Error obteniendo analíticas reales:", error);
        res.status(500).json({ success: false, message: "Error al calcular analíticas reales del usuario" });
    }
});
// ──────────────────────────────────────────────────────────────────────────────
router.get("/user/analytics-export", auth_middleware_1.flexibleAuth, async (req, res) => {
    const format = req.query.format;
    const renderer = (0, bridge_1.resolveReportRenderer)(format);
    if (!renderer) {
        res.status(400).json({
            success: false,
            message: `Formato no soportado. Usa uno de: ${bridge_1.SUPPORTED_REPORT_FORMATS.join(", ")}`,
        });
        return;
    }
    try {
        const userId = req.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f";
        const summary = await (0, analytics_service_1.calculateRealUserAnalytics)(userId);
        const report = new bridge_1.UserDashboardReport({
            userId,
            userName: req.userName || "Hernán Gutiérrez",
            totalInterviews: summary.metrics.totalInterviews,
            averageScore: summary.readinessScore,
            technicalScore: summary.pillars.find((p) => p.name.includes("Técnic"))?.score || summary.readinessScore,
            communicationScore: summary.pillars.find((p) => p.name.includes("Comunic"))?.score || summary.readinessScore,
            cefrLevel: summary.readinessScore >= 70 ? "B2 - Upper Intermediate" : "B1 - Intermediate",
            topStrengths: [
                "Diseño de arquitectura limpia y principios SOLID",
                "Manejo de TypeScript, React, Go y microservicios",
                "Resolución algorítmica estructurada",
            ],
            keyImprovements: summary.blindspots.map((b) => b.detail).slice(0, 3),
            totalApplications: summary.metrics.totalApplications,
        }, renderer);
        const { content, contentType, filename } = report.export();
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.status(200).send(content);
    }
    catch (error) {
        console.error("[FeedbackRoutes] Error exportando analíticas:", error);
        res.status(500).json({ success: false, message: "Error al exportar analíticas" });
    }
});
// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/mediator/logs - Trazabilidad del Patrón Mediator (GoF)
// ──────────────────────────────────────────────────────────────────────────────
router.get("/mediator/logs", auth_middleware_1.flexibleAuth, async (req, res) => {
    const userId = req.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f";
    res.status(200).json({
        success: true,
        logs: careerMediator.getCoordinationLogs(),
        alerts: careerMediator.analyticsColleague.getAlertsForUser(userId),
        milestones: careerMediator.analyticsColleague.getMilestonesForUser(userId),
    });
});
// ──────────────────────────────────────────────────────────────────────────────
// POST /feedback - Generar y persistir feedback de entrevista
// ──────────────────────────────────────────────────────────────────────────────
router.post("/", auth_middleware_1.requireAuth, rate_limit_middleware_1.aiRateLimiter, async (req, res) => {
    try {
        const result = await interviewEvaluationFacade.processAndSaveEvaluation({
            interviewId: req.body.interviewId,
            userId: req.userId || "anonymous",
            transcript: req.body.transcript,
            language: req.body.language,
        });
        // Patrón Mediator (GoF): Notificar que la evaluación concluyó para sincronizar
        // entrevista (finalized), notas de postulación asociada y alertas de analítica
        try {
            await careerMediator.feedbackColleague.notifyEvaluationCompleted({
                feedbackId: result.feedbackId,
                feedback: result.feedback,
            });
        }
        catch (mediatorErr) {
            console.warn("[FeedbackRoutes] Aviso en coordinación Mediator:", mediatorErr);
        }
        res.status(201).json({
            success: true,
            feedbackId: result.feedbackId,
            feedback: result.feedback,
        });
    }
    catch (error) {
        console.error("[FeedbackRoutes] Error procesando evaluación:", error?.message || error);
        res.status(500).json({
            success: false,
            message: error?.message || "Error al procesar el feedback con la IA",
        });
    }
});
// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/:interviewId - Obtener feedback guardado
// ──────────────────────────────────────────────────────────────────────────────
router.get("/:interviewId", auth_middleware_1.requireAuth, async (req, res) => {
    const { interviewId } = req.params;
    try {
        const feedback = await (0, feedback_service_1.getFeedbackByInterviewId)(interviewId, req.userId);
        if (!feedback) {
            res.status(404).json({ success: false, message: "Feedback no encontrado" });
            return;
        }
        res.status(200).json({ success: true, feedback });
    }
    catch (error) {
        console.error("[FeedbackRoutes] Error obteniendo feedback:", error);
        res.status(500).json({ success: false, message: "Error al obtener el feedback" });
    }
});
// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/:interviewId/export - Exportar feedback individual
// ──────────────────────────────────────────────────────────────────────────────
router.get("/:interviewId/export", auth_middleware_1.flexibleAuth, async (req, res) => {
    const { interviewId } = req.params;
    const reportType = String(req.query.report || "interview").toLowerCase();
    const renderer = (0, bridge_1.resolveReportRenderer)(req.query.format);
    if (!renderer) {
        res.status(400).json({
            success: false,
            message: `Formato no soportado. Usa uno de: ${bridge_1.SUPPORTED_REPORT_FORMATS.join(", ")}`,
        });
        return;
    }
    try {
        const feedback = await (0, feedback_service_1.getFeedbackByInterviewId)(interviewId, req.userId);
        if (!feedback) {
            res.status(404).json({ success: false, message: "Feedback no encontrado" });
            return;
        }
        let report;
        if (reportType === "english") {
            if (!feedback.englishFeedback) {
                res.status(404).json({ success: false, message: "Esta entrevista no tiene evaluación de inglés (CEFR)" });
                return;
            }
            report = new bridge_1.EnglishProficiencyReport(interviewId, feedback.englishFeedback, renderer);
        }
        else if (reportType === "interview") {
            report = new bridge_1.InterviewFeedbackReport(feedback, renderer);
        }
        else {
            res.status(400).json({ success: false, message: "Tipo de reporte no soportado. Usa: interview, english" });
            return;
        }
        const { content, contentType, filename } = report.export();
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.status(200).send(content);
    }
    catch (error) {
        console.error("[FeedbackRoutes] Error exportando feedback:", error);
        res.status(500).json({ success: false, message: "Error al exportar el feedback" });
    }
});
exports.default = router;
//# sourceMappingURL=feedback.routes.js.map