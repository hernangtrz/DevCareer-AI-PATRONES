import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { RemoteOkJobApi } from "./remote-ok-job.api";
import { JobOffer } from "../../types/job.types";
/**
 * ============================================================================
 * PATRON ADAPTER - CONCRETE ADAPTER (GoF): RemoteOkJobAdapter
 * ============================================================================
 * Adapta el feed de RemoteOkJobApi vinculando directamente a la pagina
 * de postulacion activa del empleo.
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
    private mapToDomain;
}
