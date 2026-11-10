"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareerWorkflowMediator = void 0;
exports.getDefaultCareerMediator = getDefaultCareerMediator;
const job_application_colleague_1 = require("./colleagues/job-application.colleague");
const interview_session_colleague_1 = require("./colleagues/interview-session.colleague");
const evaluation_feedback_colleague_1 = require("./colleagues/evaluation-feedback.colleague");
const candidate_analytics_colleague_1 = require("./colleagues/candidate-analytics.colleague");
/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL MEDIATOR (GoF): CareerWorkflowMediator
 * ============================================================================
 * Mediador concreto que centraliza la comunicación multidireccional entre los
 * 4 colegas del dominio de empleabilidad:
 *  1. `JobApplicationColleague`     (Seguimiento de postulaciones)
 *  2. `InterviewSessionColleague`   (Preparación y estado de entrevistas)
 *  3. `EvaluationFeedbackColleague` (Diagnóstico de IA, puntajes y CEFR)
 *  4. `CandidateAnalyticsColleague` (Hitos de progreso y alertas de brechas)
 *
 * Beneficios arquitectónicos:
 *  - Convierte una malla de dependencias N x (N - 1) en una topología estrella.
 *  - Cumple SRP y OCP: cada colega se enfoca en su responsabilidad única y el
 *    mediador encapsula las reglas de reacción transversal entre módulos.
 */
class CareerWorkflowMediator {
    constructor(jobColleague = new job_application_colleague_1.JobApplicationColleague(), interviewColleague = new interview_session_colleague_1.InterviewSessionColleague(), feedbackColleague = new evaluation_feedback_colleague_1.EvaluationFeedbackColleague(), analyticsColleague = new candidate_analytics_colleague_1.CandidateAnalyticsColleague()) {
        this.jobColleague = jobColleague;
        this.interviewColleague = interviewColleague;
        this.feedbackColleague = feedbackColleague;
        this.analyticsColleague = analyticsColleague;
        this.coordinationLogs = [];
        this.lastPreparedInterviewId = null;
        // Vincular todos los colegas a este mediador central
        this.jobColleague.setMediator(this);
        this.interviewColleague.setMediator(this);
        this.feedbackColleague.setMediator(this);
        this.analyticsColleague.setMediator(this);
    }
    /**
     * Recibe notificaciones de cualquier colega y orquesta las reacciones
     * correspondientes en los demás colegas sin que ellos se conozcan entre sí.
     */
    async notify(sender, event, payload) {
        const targets = [];
        const actions = [];
        const metadata = {};
        switch (event) {
            case "JOB_APPLIED": {
                const data = payload;
                // 1. Notificar al colega de Analítica para registrar el hito
                targets.push(this.analyticsColleague.colleagueName);
                this.analyticsColleague.recordMilestone({
                    userId: data.userId,
                    type: "application",
                    summary: `Nueva postulación registrada: ${data.jobTitle} en ${data.company}`,
                    score: data.matchScore,
                });
                actions.push(`Hito de postulación registrado en Analítica para ${data.jobTitle} (${data.company}).`);
                metadata.applicationId = data.applicationId;
                break;
            }
            case "APPLICATION_STATUS_CHANGED": {
                const data = payload;
                // 1. Registrar el cambio de etapa en Analítica
                targets.push(this.analyticsColleague.colleagueName);
                this.analyticsColleague.recordMilestone({
                    userId: data.userId,
                    type: "interview_stage",
                    summary: `Postulación #${data.applicationId} cambió a estado "${data.newStatus}".`,
                });
                actions.push(`Estado "${data.newStatus}" registrado en línea de tiempo de Analítica.`);
                // 2. Si pasa a etapa de entrevista ("interviewing"), coordinar con InterviewSessionColleague
                //    para preparar un simulacro técnico adaptado y vincularlo en JobApplicationColleague
                if (data.newStatus === "interviewing") {
                    const jobTitle = data.jobTitle || "Software Engineer";
                    const company = data.company || "Tech Company";
                    const techstack = data.techstack || ["TypeScript", "Node.js"];
                    targets.push(this.interviewColleague.colleagueName);
                    const interviewId = await this.interviewColleague.prepareInterviewForJobStage({
                        userId: data.userId,
                        jobTitle,
                        company,
                        techstack,
                    });
                    this.lastPreparedInterviewId = interviewId;
                    metadata.preparedInterviewId = interviewId;
                    actions.push(`Simulacro técnico #${interviewId} ensamblado automáticamente para ${jobTitle} @ ${company}.`);
                    targets.push(this.jobColleague.colleagueName);
                    await this.jobColleague.attachPreparedInterviewNote(data.applicationId, interviewId, jobTitle);
                    actions.push(`Nota de seguimiento con simulacro #${interviewId} anexada a la postulación #${data.applicationId}.`);
                }
                break;
            }
            case "INTERVIEW_EVALUATED": {
                const data = payload;
                // 1. Coordinar con InterviewSessionColleague para marcar la sesión como finalizada
                //    y extraer empresa/rol si no venían explícitos
                targets.push(this.interviewColleague.colleagueName);
                const interviewMeta = await this.interviewColleague.finalizeAndGetMetadata(data.interviewId);
                const resolvedRole = data.role || interviewMeta?.role;
                const resolvedCompany = data.company || interviewMeta?.company;
                actions.push(`Entrevista #${data.interviewId} marcada como finalizada.`);
                // 2. Coordinar con JobApplicationColleague para sincronizar el puntaje en la postulación asociada
                targets.push(this.jobColleague.colleagueName);
                const syncedAppId = await this.jobColleague.syncEvaluationResultWithApplication({
                    userId: data.userId,
                    interviewId: data.interviewId,
                    score: data.totalScore,
                    cefrLevel: data.cefrLevel,
                    company: resolvedCompany,
                    role: resolvedRole,
                });
                if (syncedAppId) {
                    metadata.syncedApplicationId = syncedAppId;
                    actions.push(`Puntaje (${data.totalScore}/100) sincronizado en notas de la postulación #${syncedAppId}.`);
                }
                else {
                    actions.push(`Verificación de postulación completada (entrevista libre sin vacante asociada).`);
                }
                // 3. Coordinar con CandidateAnalyticsColleague para registrar hitos y alertas de brechas
                targets.push(this.analyticsColleague.colleagueName);
                this.analyticsColleague.recordMilestone({
                    userId: data.userId,
                    type: "evaluation",
                    summary: `Simulacro evaluado (${resolvedRole || "Entrevista Técnica"}): ${data.totalScore}/100`,
                    score: data.totalScore,
                });
                const alerts = this.analyticsColleague.registerEvaluationInsights({
                    userId: data.userId,
                    interviewId: data.interviewId,
                    totalScore: data.totalScore,
                    cefrLevel: data.cefrLevel,
                    areasForImprovement: data.areasForImprovement,
                    role: resolvedRole,
                });
                metadata.alertsGenerated = alerts.length;
                actions.push(`Analítica actualizada con hito de evaluación y ${alerts.length} alerta(s) de puntos ciegos.`);
                break;
            }
            case "SKILL_GAP_DETECTED": {
                const data = payload;
                // 1. Coordinar con InterviewSessionColleague para crear entrevista de refuerzo
                targets.push(this.interviewColleague.colleagueName);
                const refresherInterviewId = await this.interviewColleague.createTargetedRefresherInterview({
                    userId: data.userId,
                    targetRole: data.targetRole,
                    missingSkills: data.missingSkills,
                    source: data.source,
                });
                this.lastPreparedInterviewId = refresherInterviewId;
                metadata.refresherInterviewId = refresherInterviewId;
                actions.push(`Entrevista de refuerzo #${refresherInterviewId} creada para cubrir brechas: ${data.missingSkills.join(", ")}.`);
                // 2. Coordinar con CandidateAnalyticsColleague para registrar la alerta de brecha
                targets.push(this.analyticsColleague.colleagueName);
                this.analyticsColleague.registerSkillGapAlert(data);
                this.analyticsColleague.recordMilestone({
                    userId: data.userId,
                    type: "skill_gap",
                    summary: `Plan de refuerzo activado desde ${data.source} para ${data.targetRole}`,
                    score: data.score,
                });
                actions.push(`Alerta de brecha técnica registrada en Analítica.`);
                break;
            }
        }
        this.coordinationLogs.unshift({
            id: `med-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            senderColleague: sender.colleagueName,
            event,
            targetColleagues: targets,
            actionsExecuted: actions,
            metadata,
        });
    }
    getLastPreparedInterviewId() {
        return this.lastPreparedInterviewId;
    }
    getCoordinationLogs() {
        return [...this.coordinationLogs];
    }
    clearLogs() {
        this.coordinationLogs = [];
        this.lastPreparedInterviewId = null;
    }
}
exports.CareerWorkflowMediator = CareerWorkflowMediator;
/**
 * Instancia compartida por defecto del Mediador para coordinar las rutas HTTP del Backend.
 */
let defaultMediatorInstance = null;
function getDefaultCareerMediator() {
    if (!defaultMediatorInstance) {
        defaultMediatorInstance = new CareerWorkflowMediator();
    }
    return defaultMediatorInstance;
}
//# sourceMappingURL=career-workflow.mediator.js.map