import { BaseColleague } from "../base.colleague";
import { ICareerMediator } from "../career-mediator.interface";
import { IJobApplicationRepository } from "../../../repositories/job-application.repository";
import { MemoryJobApplicationRepository } from "../../../repositories/memory-job-application.repository";
import { JobApplication } from "../../../types/job.types";

/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 1: JobApplicationColleague
 * ============================================================================
 * Gestiona eventos y reacciones sobre las postulaciones de empleo del candidato.
 * No tiene conocimiento directo de Entrevistas, Evaluaciones ni Analítica;
 * toda coordinación transversal ocurre exclusivamente a través de `ICareerMediator`.
 */
export class JobApplicationColleague extends BaseColleague {
  public readonly colleagueName = "JobApplicationColleague";

  constructor(
    private appRepo: IJobApplicationRepository = new MemoryJobApplicationRepository(),
    mediator?: ICareerMediator
  ) {
    super(mediator);
  }

  /**
   * Dispara la notificación cuando el candidato registra una nueva postulación.
   */
  public async notifyJobApplied(application: JobApplication): Promise<void> {
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
  public async changeStatusAndNotify(
    applicationId: string,
    userId: string,
    newStatus: JobApplication["status"]
  ): Promise<JobApplication | null> {
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
  public async attachPreparedInterviewNote(
    applicationId: string,
    interviewId: string,
    jobTitle: string
  ): Promise<boolean> {
    const app = await this.appRepo.getById(applicationId);
    if (!app) return false;

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
  public async syncEvaluationResultWithApplication(params: {
    userId: string;
    interviewId: string;
    score: number;
    cefrLevel?: string;
    company?: string;
    role?: string;
  }): Promise<string | null> {
    const { userId, interviewId, score, cefrLevel, company, role } = params;
    const userApps = await this.appRepo.getByUserId(userId);
    if (!userApps || userApps.length === 0) return null;

    const targetApp = userApps.find((app) => {
      if (app.notes && app.notes.includes(interviewId)) return true;
      if (company && app.company.toLowerCase().includes(company.toLowerCase())) return true;
      if (role && role.toLowerCase().includes(app.company.toLowerCase())) return true;
      if (role && app.jobTitle.toLowerCase().includes(role.split("@")[0].trim().toLowerCase())) {
        return true;
      }
      return false;
    });

    if (!targetApp) return null;

    const readinessVerdict =
      score >= 80
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

