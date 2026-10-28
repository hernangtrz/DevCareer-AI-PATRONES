import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { RemoteOkJobAdapter } from "./remote-ok-job.adapter";
import { GreenhouseJobAdapter } from "./greenhouse-job.adapter";
import { LeverJobAdapter } from "./lever-job.adapter";

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
export class JobPortalAdapterRegistry {
  private static instance: JobPortalAdapterRegistry;
  private adapters: Map<string, IJobPortalAdapter> = new Map();

  private constructor() {
    this.register(new GreenhouseJobAdapter());
    this.register(new LeverJobAdapter());
    this.register(new RemoteOkJobAdapter());
  }

  public static getInstance(): JobPortalAdapterRegistry {
    if (!JobPortalAdapterRegistry.instance) {
      JobPortalAdapterRegistry.instance = new JobPortalAdapterRegistry();
    }
    return JobPortalAdapterRegistry.instance;
  }

  public register(adapter: IJobPortalAdapter): void {
    this.adapters.set(adapter.portalName.toLowerCase(), adapter);
  }

  public getAdapter(name: string): IJobPortalAdapter | null {
    return this.adapters.get(name.toLowerCase()) || null;
  }

  public getAllAdapters(): IJobPortalAdapter[] {
    return Array.from(this.adapters.values());
  }
}
