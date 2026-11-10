import { IJobPortalAdapter } from "./job-portal-adapter.interface";
/**
 * ============================================================================
 * PATRON SINGLETON / REGISTRY (GoF): JobPortalAdapterRegistry
 * ============================================================================
 * Administra exclusivamente adaptadores con formularios de postulacion
 * directos y oficiales:
 * 1. Greenhouse ATS (GreenhouseJobAdapter) - Formulario directo de aplicacion (#app)
 * 2. Lever ATS (LeverJobAdapter) - Formulario oficial de postulacion (/apply)
 * 3. RemoteOK Tech (RemoteOkJobAdapter) - Empleos tech verificados con postulacion directa
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
