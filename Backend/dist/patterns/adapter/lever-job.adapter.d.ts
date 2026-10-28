import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { LeverJobApi } from "./lever-job.api";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): LeverJobAdapter
 * ============================================================================
 * Adapta el esquema de LeverJobApi al contrato estándar IJobPortalAdapter.
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
