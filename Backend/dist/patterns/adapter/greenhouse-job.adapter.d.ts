import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { GreenhouseJobApi } from "./greenhouse-job.api";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRON ADAPTER - CONCRETE ADAPTER (GoF): GreenhouseJobAdapter
 * ============================================================================
 * Adapta las vacantes de GreenhouseJobApi enlazando directamente al formulario
 * de postulacion (#app) donde el aspirante carga su CV y datos de contacto.
 */
export declare class GreenhouseJobAdapter implements IJobPortalAdapter {
    readonly portalName = "Greenhouse";
    private adaptee;
    constructor(adaptee?: GreenhouseJobApi);
    fetchJobs(params?: {
        query?: string;
        tags?: string[];
        limit?: number;
    }): Promise<JobOffer[]>;
    getJobDetails(externalId: string): Promise<JobOffer | null>;
    private mapToDomain;
}
