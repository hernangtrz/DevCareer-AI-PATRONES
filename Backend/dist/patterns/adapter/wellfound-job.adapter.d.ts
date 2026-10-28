import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { WellfoundJobApi } from "./wellfound-job.api";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): WellfoundJobAdapter
 * ============================================================================
 * Adapta el esquema de WellfoundJobApi al contrato estándar IJobPortalAdapter.
 */
export declare class WellfoundJobAdapter implements IJobPortalAdapter {
    readonly portalName = "Wellfound";
    private adaptee;
    constructor(adaptee?: WellfoundJobApi);
    fetchJobs(params?: {
        query?: string;
        tags?: string[];
        limit?: number;
    }): Promise<JobOffer[]>;
    getJobDetails(externalId: string): Promise<JobOffer | null>;
    private mapToDomain;
}
