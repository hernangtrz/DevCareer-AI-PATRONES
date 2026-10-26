"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteOkJobAdapter = void 0;
const remote_ok_job_api_1 = require("./remote-ok-job.api");
/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): RemoteOkJobAdapter
 * ============================================================================
 * Adapta la interfaz de RemoteOkJobApi al contrato estándar IJobPortalAdapter.
 * Transforma los objetos 'RemoteOkRawJob' a la entidad de dominio 'JobOffer'.
 */
class RemoteOkJobAdapter {
    constructor(adaptee) {
        this.portalName = "RemoteOK";
        this.adaptee = adaptee || new remote_ok_job_api_1.RemoteOkJobApi();
    }
    async fetchJobs(params) {
        const tag = params?.tags?.[0] || params?.query || "";
        const rawJobs = await this.adaptee.getRemoteJobs(tag, params?.limit || 20);
        return rawJobs.map((raw) => this.mapToDomain(raw));
    }
    async getJobDetails(externalId) {
        const all = await this.fetchJobs();
        return all.find((j) => j.id === externalId) || null;
    }
    /**
     * Traducción estructural entre el modelo externo y el modelo de dominio interno.
     */
    mapToDomain(raw) {
        const salaryStr = raw.salary_min && raw.salary_max
            ? `$${Math.round(raw.salary_min / 1000)}k - $${Math.round(raw.salary_max / 1000)}k USD`
            : "$80k - $120k USD";
        const titleLower = raw.position.toLowerCase();
        let seniority = "Mid-Level";
        if (titleLower.includes("senior") || titleLower.includes("sr") || titleLower.includes("architect")) {
            seniority = "Senior";
        }
        else if (titleLower.includes("lead") || titleLower.includes("principal")) {
            seniority = "Lead";
        }
        else if (titleLower.includes("junior") || titleLower.includes("jr")) {
            seniority = "Junior";
        }
        return {
            id: raw.id,
            title: raw.position,
            company: raw.company,
            location: raw.location || "Remote",
            type: "Remote",
            salary: salaryStr,
            currency: "USD",
            description: raw.description,
            requiredSkills: (raw.tags || []).map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
            seniority,
            platform: "RemoteOK",
            url: raw.url,
            createdAt: raw.date || new Date().toISOString(),
        };
    }
}
exports.RemoteOkJobAdapter = RemoteOkJobAdapter;
//# sourceMappingURL=remote-ok-job.adapter.js.map