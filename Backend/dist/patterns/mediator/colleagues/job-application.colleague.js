"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationColleague = void 0;
const base_colleague_1 = require("../base.colleague");
const memory_job_application_repository_1 = require("../../../repositories/memory-job-application.repository");
/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 1: JobApplicationColleague
 * ============================================================================
 * Gestiona eventos y reacciones sobre las postulaciones de empleo del candidato.
 * No tiene conocimiento directo de Entrevistas, Evaluaciones ni Analítica;
 * toda coordinación transversal ocurre exclusivamente a través de `ICareerMediator`.
 */
class JobApplicationColleague extends base_colleague_1.BaseColleague {
    constructor(appRepo = new memory_job_application_repository_1.MemoryJobApplicationRepository(), mediator) {
        super(mediator);
        this.appRepo = appRepo;
        this.colleagueName = "JobApplicationColleague";
    }
    /**
     * Dispara la notificación cuando el candidato registra una nueva postulación.
     */
    async notifyJobApplied(application) {
        await this.emit("JOB_APPLIED", {
            userId: application.userId,
            applicationId: application.id,
            jobId: application.jobId,
            jobTitle: application.jobTitle,
            company: application.company,
            techstack: application.techstack || [],
            matchScore: application.matchScore,
        });
    }
    /**
     * Actualiza el estado de una postulación y notifica al Mediador para que
     * coordine reacciones en otros módulos (ej. preparar simulacro si pasa a 'interviewing').
     */
    async changeStatusAndNotify(applicationId, userId, newStatus) {
        await this.appRepo.updateStatus(applicationId, newStatus);
        const current = await this.appRepo.getById(applicationId);
        await this.emit("APPLICATION_STATUS_CHANGED", {
            userId: current?.userId || userId,
            applicationId,
            newStatus,
            jobTitle: current?.jobTitle,
            company: current?.company,
            techstack: current?.techstack || [],
        });
        // Releer tras la emisión porque el Mediador pudo anexar el simulacro preparado a las notas
        return this.appRepo.getById(applicationId);
    }
    /**
     * Acción invocada por el Mediador cuando `InterviewSessionColleague` prepara
     * un simulacro automático para una postulación que pasó a etapa de entrevista.
     */
    async attachPreparedInterviewNote(applicationId, interviewId, jobTitle) {
        const app = await this.appRepo.getById(applicationId);
        if (!app)
            return false;
        const tag = `[Simulacro IA Preparado: #${interviewId}]`;
        if (app.notes && app.notes.includes(tag)) {
            return true;
        }
        const prefix = app.notes ? `${app.notes.trim()} | ` : "";
        const newNotes = `${prefix}${tag} Entrevista técnica lista para practicar el rol de ${jobTitle}.`;
        await this.appRepo.updateNotes(applicationId, newNotes);
        return true;
    }
    /**
     * Acción invocada por el Mediador cuando `EvaluationFeedbackColleague` concluye
     * la calificación de una entrevista vinculada a una empresa/rol postulado.
     */
    async syncEvaluationResultWithApplication(params) {
        const { userId, interviewId, score, cefrLevel, company, role } = params;
        const userApps = await this.appRepo.getByUserId(userId);
        if (!userApps || userApps.length === 0)
            return null;
        const targetApp = userApps.find((app) => {
            if (app.notes && app.notes.includes(interviewId))
                return true;
            if (company && app.company.toLowerCase().includes(company.toLowerCase()))
                return true;
            if (role && role.toLowerCase().includes(app.company.toLowerCase()))
                return true;
            if (role && app.jobTitle.toLowerCase().includes(role.split("@")[0].trim().toLowerCase())) {
                return true;
            }
            return false;
        });
        if (!targetApp)
            return null;
        const readinessVerdict = score >= 80
            ? "Listo para entrevista real"
            : score >= 65
                ? "Preparación intermedia"
                : "Requiere refuerzo técnico";
        const cefrBadge = cefrLevel ? ` | Inglés CEFR: ${cefrLevel}` : "";
        const auditNote = `[Resultado Simulacro #${interviewId}: ${score}/100${cefrBadge} — ${readinessVerdict}]`;
        if (!targetApp.notes?.includes(`[Resultado Simulacro #${interviewId}:`)) {
            const updatedNotes = targetApp.notes
                ? `${targetApp.notes.trim()} | ${auditNote}`
                : auditNote;
            await this.appRepo.updateNotes(targetApp.id, updatedNotes);
        }
        return targetApp.id;
    }
}
exports.JobApplicationColleague = JobApplicationColleague;
//# sourceMappingURL=job-application.colleague.js.map