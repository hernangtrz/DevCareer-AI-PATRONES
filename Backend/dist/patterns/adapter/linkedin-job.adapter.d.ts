import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { LinkedInJobApi } from "./linkedin-job.api";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): LinkedInJobAdapter
 * ============================================================================
 * Adapta el esquema de LinkedInJobApi al contrato estándar IJobPortalAdapter.
 */
export declare class LinkedInJobAdapter implements IJobPortalAdapter {
    readonly portalName = "LinkedIn";
    private adaptee;
    constructor(adaptee?: LinkedInJobApi);
    fetchJobs(params?: {
        query?: string;
        tags?: string[];
        limit?: number;
    }): Promise<JobOffer[]>;
    getJobDetails(externalId: string): Promise<JobOffer | null>;
    private mapToDomain;
}
