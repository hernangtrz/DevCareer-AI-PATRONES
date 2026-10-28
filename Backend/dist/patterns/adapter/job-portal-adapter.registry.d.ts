import { IJobPortalAdapter } from "./job-portal-adapter.interface";
/**
 * ============================================================================
 * PATRÓN SINGLETON / REGISTRY (GoF): JobPortalAdapterRegistry
 * ============================================================================
 * Centraliza la administración de adaptadores de portales de empleo disponibles:
 * 1. RemoteOK (RemoteOkJobAdapter)
 * 2. LinkedIn (LinkedInJobAdapter)
 * 3. Greenhouse ATS (GreenhouseJobAdapter)
 * 4. Lever ATS (LeverJobAdapter)
 * 5. Wellfound Startups (WellfoundJobAdapter)
 * 6. Internal Curated Catalog (InternalJobPortalAdapter)
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
