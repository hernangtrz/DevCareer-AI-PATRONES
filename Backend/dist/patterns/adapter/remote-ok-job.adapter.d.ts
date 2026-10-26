import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { RemoteOkJobApi } from "./remote-ok-job.api";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): RemoteOkJobAdapter
 * ============================================================================
 * Adapta la interfaz de RemoteOkJobApi al contrato estándar IJobPortalAdapter.
 * Transforma los objetos 'RemoteOkRawJob' a la entidad de dominio 'JobOffer'.
 */
export declare class RemoteOkJobAdapter implements IJobPortalAdapter {
    readonly portalName = "RemoteOK";
    private adaptee;
    constructor(adaptee?: RemoteOkJobApi);
    fetchJobs(params?: {
        query?: string;
        tags?: string[];
        limit?: number;
    }): Promise<JobOffer[]>;
    getJobDetails(externalId: string): Promise<JobOffer | null>;
    /**
     * Traducción estructural entre el modelo externo y el modelo de dominio interno.
     */
    private mapToDomain;
}
