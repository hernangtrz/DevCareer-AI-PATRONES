import { JobOffer, JobApplication } from "../../types/job.types";
import { IJobApplicationRepository } from "../../repositories/job-application.repository";
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL FACADE (GoF): JobApplicationFacade
 * ============================================================================
 * Proporciona una interfaz unificada y simple para el flujo complejo de postulación:
 *  1. Genera una Carta de Presentación (Cover Letter) adaptada a la vacante con IA.
 *  2. Sintetiza una Hoja de Vida con palabras clave alineadas al perfil del trabajo.
 *  3. Construye y programa una entrevista técnica a la medida con el patrón Builder.
 *  4. Registra la postulación en la base de datos de manera persistente.
 */
export declare class JobApplicationFacade {
    private appRepo;
    constructor(appRepo?: IJobApplicationRepository);
    /**
     * Ejecuta el flujo integral de postulación con IA y Builder.
     */
    processCompleteApplication(params: {
        userId: string;
        job: JobOffer;
        userSkills?: string[];
        userExperienceSummary?: string;
        createMockInterview?: boolean;
        notes?: string;
    }): Promise<{
        application: JobApplication;
        interviewId?: string;
    }>;
    /**
     * Genera una carta de presentación formal y persuasiva con el motor de IA.
     */
    generateTailoredCoverLetter(job: JobOffer, userSkills: string[], experience: string): Promise<string>;
    private generateAdaptedResumeSummary;
}
