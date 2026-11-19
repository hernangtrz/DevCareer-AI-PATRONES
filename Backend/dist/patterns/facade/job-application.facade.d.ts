import { JobOffer, JobApplication } from "../../types/job.types";
import { IJobApplicationRepository } from "../../repositories/job-application.repository";
export interface ProcessApplicationInput {
    userId: string;
    job: JobOffer;
    userSkills?: string[];
    userExperienceSummary?: string;
    notes?: string;
}
export interface ProcessApplicationResult {
    application: JobApplication;
    interviewId?: string;
    coverLetter: string;
    adaptedResumeSummary: string;
}
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL FACADE (GoF): JobApplicationFacade
 * ============================================================================
 * Fachada de Alto Nivel que orquesta y encapsula el flujo completo de postulación
 * laboral en DevCareer AI coordinando 4 subsistemas complejos:
 *
 *  1. Subsistema de IA (AIProviderFactory / IAIProvider):
 *     Genera una Carta de Presentación / Motivación (Cover Letter) persuasiva
 *     y una Hoja de Vida Adaptada al cargo y tecnologías requeridas.
 *
 *  2. Subsistema Builder (InterviewDirector & InterviewBuilder):
 *     Construye un simulacro técnico personalizado a la medida de la empresa,
 *     el rol y el stack de la vacante.
 *
 *  3. Subsistema de Entrevistas (interviews.service):
 *     Registra la entrevista técnica para que el usuario pueda practicar.
 *
 *  4. Subsistema de Persistencia (IJobApplicationRepository):
 *     Almacena la postulación con todos los materiales generados y notas de seguimiento.
 */
export declare class JobApplicationFacade {
    private appRepo;
    constructor(appRepo?: IJobApplicationRepository);
    /**
     * Procesa la postulación completa coordinando concurrentemente IA, Builder y Persistencia.
     */
    processCompleteApplication(params: ProcessApplicationInput): Promise<ProcessApplicationResult>;
    /**
     * Subsistema de Generación de Materiales con IA
     */
    private generateApplicationMaterials;
    /**
     * Generador de fallback de alta calidad en caso de contingencia o tests offline
     */
    private generateFallbackMaterials;
    /**
     * Deriva preguntas técnicas relevantes para la vacante
     */
    private deriveQuestionsForJob;
}
