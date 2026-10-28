"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobPortalAdapterRegistry = void 0;
const remote_ok_job_adapter_1 = require("./remote-ok-job.adapter");
const linkedin_job_adapter_1 = require("./linkedin-job.adapter");
const greenhouse_job_adapter_1 = require("./greenhouse-job.adapter");
const lever_job_adapter_1 = require("./lever-job.adapter");
const wellfound_job_adapter_1 = require("./wellfound-job.adapter");
const internal_job_portal_adapter_1 = require("./internal-job-portal.adapter");
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
class JobPortalAdapterRegistry {
    constructor() {
        this.adapters = new Map();
        this.register(new remote_ok_job_adapter_1.RemoteOkJobAdapter());
        this.register(new linkedin_job_adapter_1.LinkedInJobAdapter());
        this.register(new greenhouse_job_adapter_1.GreenhouseJobAdapter());
        this.register(new lever_job_adapter_1.LeverJobAdapter());
        this.register(new wellfound_job_adapter_1.WellfoundJobAdapter());
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