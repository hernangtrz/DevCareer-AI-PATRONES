import { JobOffer, JobApplication } from "../../types/job.types";
import { IJobApplicationRepository } from "../../repositories/job-application.repository";
import { MemoryJobApplicationRepository } from "../../repositories/memory-job-application.repository";

/**
 * ============================================================================
 * PATRON ESTRUCTURAL FACADE (GoF): JobApplicationFacade
 * ============================================================================
 * Simplifica la persistencia y administracion del ciclo de vida de postulaciones.
 * Registra todos los campos clave (oferta, empresa, salario, tecnologias, estado, url, notas)
 * permitiendo al usuario trackear sus aplicaciones sin friccion.
 */
export class JobApplicationFacade {
  constructor(
    private appRepo: IJobApplicationRepository = new MemoryJobApplicationRepository()
  ) {}

  async processCompleteApplication(params: {
    userId: string;
    job: JobOffer;
    notes?: string;
  }): Promise<{ application: JobApplication; interviewId?: string }> {
    const { userId, job, notes = "" } = params;

    const appId = await this.appRepo.create({
      userId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      platform: job.platform,
      location: job.location,
      salary: job.salary,
      appliedAt: new Date().toISOString(),
      status: "applied",
      coverLetter: "",
      adaptedResumeSummary: "",
      matchScore: job.matchScore || 85,
      notes,
      url: job.url,
      techstack: job.requiredSkills || [],
    });

    const application = (await this.appRepo.getById(appId))!;
    return { application };
  }
}
