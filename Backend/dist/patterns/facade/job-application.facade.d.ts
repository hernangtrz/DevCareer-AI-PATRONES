import { JobOffer, JobApplication } from "../../types/job.types";
import { IJobApplicationRepository } from "../../repositories/job-application.repository";
/**
 * ============================================================================
 * PATRON ESTRUCTURAL FACADE (GoF): JobApplicationFacade
 * ============================================================================
 * Simplifica la persistencia y administracion del ciclo de vida de postulaciones.
 * Registra todos los campos clave (oferta, empresa, salario, tecnologias, estado, url, notas)
 * permitiendo al usuario trackear sus aplicaciones sin friccion.
 */
export declare class JobApplicationFacade {
    private appRepo;
    constructor(appRepo?: IJobApplicationRepository);
    processCompleteApplication(params: {
        userId: string;
        job: JobOffer;
        notes?: string;
    }): Promise<{
        application: JobApplication;
        interviewId?: string;
    }>;
}
