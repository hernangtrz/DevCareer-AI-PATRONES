"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobPortalAdapterRegistry = void 0;
const remote_ok_job_adapter_1 = require("./remote-ok-job.adapter");
const internal_job_portal_adapter_1 = require("./internal-job-portal.adapter");
/**
 * ============================================================================
 * PATRÓN SINGLETON / CATALOG (GoF): JobPortalAdapterRegistry
 * ============================================================================
 * Centraliza la administración de adaptadores de portales de empleo disponibles.
 * Permite resolver adaptadores dinámicamente según el portal solicitado.
 */
class JobPortalAdapterRegistry {
    constructor() {
        this.adapters = new Map();
        this.register(new remote_ok_job_adapter_1.RemoteOkJobAdapter());
        this.register(new internal_job_portal_adapter_1.InternalJobPortalAdapter());
    }
    static getInstance() {
        if (!JobPortalAdapterRegistry.instance) {
            JobPortalAdapterRegistry.instance = new JobPortalAdapterRegistry();
        }
        return JobPortalAdapterRegistry.instance;
    }
    register(adapter) {
        this.adapters.set(adapter.portalName.toLowerCase(), adapter);
    }
    getAdapter(name) {
        return this.adapters.get(name.toLowerCase()) || null;
    }
    getAllAdapters() {
        return Array.from(this.adapters.values());
    }
}
exports.JobPortalAdapterRegistry = JobPortalAdapterRegistry;
//# sourceMappingURL=job-portal-adapter.registry.js.map