import { IJobPortalAdapter } from "./job-portal-adapter.interface";
/**
 * ============================================================================
 * PATRÓN SINGLETON / CATALOG (GoF): JobPortalAdapterRegistry
 * ============================================================================
 * Centraliza la administración de adaptadores de portales de empleo disponibles.
 * Permite resolver adaptadores dinámicamente según el portal solicitado.
 */
export declare class JobPortalAdapterRegistry {
    private static instance;
    private adapters;
    private constructor();
    static getInstance(): JobPortalAdapterRegistry;
    register(adapter: IJobPortalAdapter): void;
    getAdapter(name: string): IJobPortalAdapter | null;
    getAllAdapters(): IJobPortalAdapter[];
}
