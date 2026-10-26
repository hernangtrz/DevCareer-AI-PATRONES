import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { RemoteOkJobAdapter } from "./remote-ok-job.adapter";
import { InternalJobPortalAdapter } from "./internal-job-portal.adapter";

/**
 * ============================================================================
 * PATRÓN SINGLETON / CATALOG (GoF): JobPortalAdapterRegistry
 * ============================================================================
 * Centraliza la administración de adaptadores de portales de empleo disponibles.
 * Permite resolver adaptadores dinámicamente según el portal solicitado.
 */
export class JobPortalAdapterRegistry {
  private static instance: JobPortalAdapterRegistry;
  private adapters: Map<string, IJobPortalAdapter> = new Map();

  private constructor() {
    this.register(new RemoteOkJobAdapter());
    this.register(new InternalJobPortalAdapter());
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
