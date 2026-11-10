"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeverJobAdapter = void 0;
const lever_job_api_1 = require("./lever-job.api");
/**
 * ============================================================================
 * PATRON ADAPTER - CONCRETE ADAPTER (GoF): LeverJobAdapter
 * ============================================================================
 * Adapta las vacantes tecnicas de LeverJobApi garantizando que la URL apunte
 * directamente al formulario de postulacion oficial (/apply).
 */
class LeverJobAdapter {
    constructor(adaptee) {
        this.portalName = "Lever";
        this.adaptee = adaptee || new lever_job_api_1.LeverJobApi();
    }
    async fetchJobs(params) {
        const rawPostings = await this.adaptee.getPostings();
        const mapped = rawPostings.map(raw => this.mapToDomain(raw));
        return params?.limit ? mapped.slice(0, params.limit) : mapped;
    }
    async getJobDetails(externalId) {
        const jobs = await this.fetchJobs();
        return jobs.find(j => j.id === externalId) || null;
    }
    mapToDomain(raw) {
        const skillsText = raw.lists?.[0]?.content || "React, TypeScript, Go, Node.js";
        const skills = skillsText.split(",").map(s => s.trim());
        const titleLower = raw.text.toLowerCase();
        let seniority = "Mid-Level";
        if (titleLower.includes("staff") || titleLower.includes("principal")) {
            seniority = "Lead";
        }
        else if (titleLower.includes("senior") || titleLower.includes("sr")) {
            seniority = "Senior";
        }
        else if (titleLower.includes("junior")) {
            seniority = "Junior";
        }
        // Formulario directo oficial de postulacion de Lever
        const applyUrl = raw.hostedUrl.endsWith("/apply") ? raw.hostedUrl : (raw.hostedUrl + "/apply");
        return {
            id: "lever-" + raw.id,
            title: raw.text,
            company: "Palantir Technologies",
            location: raw.categories?.location || "Remote",
            type: "Remote",
            salary: "$130k - $175k USD",
            description: raw.descriptionPlain,
            requiredSkills: skills,
            seniority,
            platform: "Lever",
            url: applyUrl,
            createdAt: new Date(raw.createdAt).toISOString(),
        };
    }
}
exports.LeverJobAdapter = LeverJobAdapter;
//# sourceMappingURL=lever-job.adapter.js.map