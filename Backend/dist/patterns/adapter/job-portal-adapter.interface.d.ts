import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL ADAPTER (GoF) — TARGET INTERFACE: IJobPortalAdapter
 * ============================================================================
 * Define el contrato estándar y uniforme que el dominio de DevCareer AI espera
 * para consultar ofertas laborales de cualquier portal externo.
 * Permite que clientes como JobsService consuman fuentes heterogéneas sin acoplarse
 * a sus APIs o estructuras de datos propietarias.
 */
export interface IJobPortalAdapter {
    readonly portalName: string;
    fetchJobs(params?: {
        query?: string;
        tags?: string[];
        limit?: number;
    }): Promise<JobOffer[]>;
    getJobDetails(externalId: string): Promise<JobOffer | null>;
}
