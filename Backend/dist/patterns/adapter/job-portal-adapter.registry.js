"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobPortalAdapterRegistry = void 0;
const remote_ok_job_adapter_1 = require("./remote-ok-job.adapter");
const greenhouse_job_adapter_1 = require("./greenhouse-job.adapter");
const lever_job_adapter_1 = require("./lever-job.adapter");
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
class JobPortalAdapterRegistry {
    constructor() {
        this.adapters = new Map();
        this.register(new greenhouse_job_adapter_1.GreenhouseJobAdapter());
        this.register(new lever_job_adapter_1.LeverJobAdapter());
        this.register(new remote_ok_job_adapter_1.RemoteOkJobAdapter());
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