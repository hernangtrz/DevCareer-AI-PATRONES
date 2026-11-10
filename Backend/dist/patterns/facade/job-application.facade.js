"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationFacade = void 0;
const memory_job_application_repository_1 = require("../../repositories/memory-job-application.repository");
/**
 * ============================================================================
 * PATRON ESTRUCTURAL FACADE (GoF): JobApplicationFacade
 * ============================================================================
 * Simplifica la persistencia y administracion del ciclo de vida de postulaciones.
 * Registra todos los campos clave (oferta, empresa, salario, tecnologias, estado, url, notas)
 * permitiendo al usuario trackear sus aplicaciones sin friccion.
 */
class JobApplicationFacade {
    constructor(appRepo = new memory_job_application_repository_1.MemoryJobApplicationRepository()) {
        this.appRepo = appRepo;
    }
    async processCompleteApplication(params) {
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
        const application = (await this.appRepo.getById(appId));
        return { application };
    }
}
exports.JobApplicationFacade = JobApplicationFacade;
//# sourceMappingURL=job-application.facade.js.map