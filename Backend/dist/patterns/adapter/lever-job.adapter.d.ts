import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { LeverJobApi } from "./lever-job.api";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRON ADAPTER - CONCRETE ADAPTER (GoF): LeverJobAdapter
 * ============================================================================
 * Adapta las vacantes tecnicas de LeverJobApi garantizando que la URL apunte
 * directamente al formulario de postulacion oficial (/apply).
 */
export declare class LeverJobAdapter implements IJobPortalAdapter {
    readonly portalName = "Lever";
    private adaptee;
    constructor(adaptee?: LeverJobApi);
    fetchJobs(params?: {
        query?: string;
        tags?: string[];
        limit?: number;
    }): Promise<JobOffer[]>;
    getJobDetails(externalId: string): Promise<JobOffer | null>;
    private mapToDomain;
}
