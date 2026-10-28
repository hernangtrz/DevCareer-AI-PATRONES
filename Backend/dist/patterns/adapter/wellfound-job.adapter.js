"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WellfoundJobAdapter = void 0;
const wellfound_job_api_1 = require("./wellfound-job.api");
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): WellfoundJobAdapter
 * ============================================================================
 * Adapta el esquema de WellfoundJobApi al contrato estándar IJobPortalAdapter.
 */
class WellfoundJobAdapter {
    constructor(adaptee) {
        this.portalName = "Wellfound";
        this.adaptee = adaptee || new wellfound_job_api_1.WellfoundJobApi();
    }
    async fetchJobs(params) {
        const rawJobs = await this.adaptee.getStartupJobs();
        const mapped = rawJobs.map(raw => this.mapToDomain(raw));
        return params?.limit ? mapped.slice(0, params.limit) : mapped;
    }
    async getJobDetails(externalId) {
        const jobs = await this.fetchJobs();
        return jobs.find(j => j.id === externalId) || null;
    }
    mapToDomain(raw) {
        const titleLower = raw.role_title.toLowerCase();
        let seniority = "Mid-Level";
        if (titleLower.includes("founding") || titleLower.includes("senior") || titleLower.includes("lead")) {
            seniority = "Senior";
        }
        else if (titleLower.includes("junior")) {
            seniority = "Junior";
        }
        return {
            id: raw.id,
            title: raw.role_title,
            company: raw.startup_name,
            location: raw.remote_policy,
            type: "Remote",
            salary: `${raw.compensation} (${raw.equity} Equity)`,
            description: raw.pitch,
            requiredSkills: raw.tech_tags,
            seniority,
            platform: "Wellfound",
            url: raw.job_url,
            createdAt: raw.posted_date,
        };
    }
}
exports.WellfoundJobAdapter = WellfoundJobAdapter;
//# sourceMappingURL=wellfound-job.adapter.js.map