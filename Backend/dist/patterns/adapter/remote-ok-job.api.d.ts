/**
 * ============================================================================
 * PATRÓN ADAPTER — ADAPTEE (GoF): RemoteOkJobApi
 * ============================================================================
 * Representa la interfaz incompatible o externa del proveedor RemoteOK.
 * Expone un formato propio con campos como 'position', 'tags', 'url', 'epoch'.
 */
export interface RemoteOkRawJob {
    id: string;
    slug: string;
    epoch: number;
    date: string;
    company: string;
    company_logo?: string;
    position: string;
    tags: string[];
    description: string;
    location: string;
    salary_min?: number;
    salary_max?: number;
    url: string;
}
export declare class RemoteOkJobApi {
    /**
     * Obtiene empleos desde el feed público de RemoteOK con fallback seguro en memoria
     * para entornos sin conexión o rate-limits.
     */
    getRemoteJobs(tag?: string, limit?: number): Promise<RemoteOkRawJob[]>;
    private getFallbackRawJobs;
}
