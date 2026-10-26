import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): InternalJobPortalAdapter
 * ============================================================================
 * Adapta el catálogo interno de ofertas curadas para entrevistas de DevCareer AI
 * a la interfaz estándar IJobPortalAdapter.
 */
export declare class InternalJobPortalAdapter implements IJobPortalAdapter {
    readonly portalName = "Internal";
    private internalCatalog;
    fetchJobs(params?: {
        query?: string;
        tags?: string[];
        limit?: number;
    }): Promise<JobOffer[]>;
    getJobDetails(externalId: string): Promise<JobOffer | null>;
}
