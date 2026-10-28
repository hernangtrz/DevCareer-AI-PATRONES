import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { GreenhouseJobApi } from "./greenhouse-job.api";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): GreenhouseJobAdapter
 * ============================================================================
 * Adapta el esquema de GreenhouseJobApi al contrato estándar IJobPortalAdapter.
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
