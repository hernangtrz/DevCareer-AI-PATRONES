"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInJobAdapter = void 0;
const linkedin_job_api_1 = require("./linkedin-job.api");
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): LinkedInJobAdapter
 * ============================================================================
 * Adapta el esquema de LinkedInJobApi al contrato estándar IJobPortalAdapter.
 */
class LinkedInJobAdapter {
    constructor(adaptee) {
        this.portalName = "LinkedIn";
        this.adaptee = adaptee || new linkedin_job_api_1.LinkedInJobApi();
    }
    async fetchJobs(params) {
        const rawPostings = await this.adaptee.getLinkedInPostings(params?.query);
        const mapped = rawPostings.map(raw => this.mapToDomain(raw));
        return params?.limit ? mapped.slice(0, params.limit) : mapped;
    }
    async getJobDetails(externalId) {
        const jobs = await this.fetchJobs();
        return jobs.find(j => j.id === externalId) || null;
    }
    mapToDomain(raw) {
        let seniority = "Mid-Level";
        if (raw.seniorityLevel.toLowerCase().includes("senior") || raw.seniorityLevel.toLowerCase().includes("lead")) {
            seniority = raw.seniorityLevel.toLowerCase().includes("lead") ? "Lead" : "Senior";
        }
        else if (raw.seniorityLevel.toLowerCase().includes("junior")) {
            seniority = "Junior";
        }
        return {
            id: raw.jobId,
            title: raw.jobTitle,
            company: raw.companyName,
            location: raw.formattedLocation,
            type: raw.workplaceType === "Remote" ? "Remote" : "Full-time",
            salary: raw.formattedSalary,
            description: raw.jobDescription,
            requiredSkills: raw.skillsList,
            seniority,
            platform: "LinkedIn",
            url: raw.applyUrl,
            createdAt: new Date(raw.listedAt).toISOString(),
        };
    }
}
exports.LinkedInJobAdapter = LinkedInJobAdapter;
//# sourceMappingURL=linkedin-job.adapter.js.map