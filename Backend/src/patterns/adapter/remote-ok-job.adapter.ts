import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { RemoteOkJobApi, RemoteOkRawJob } from "./remote-ok-job.api";
import { JobOffer } from "../../types/job.types";

/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): RemoteOkJobAdapter
 * ============================================================================
 * Adapta la interfaz de RemoteOkJobApi al contrato estándar IJobPortalAdapter.
 * Transforma los objetos 'RemoteOkRawJob' a la entidad de dominio 'JobOffer'.
 */
export class RemoteOkJobAdapter implements IJobPortalAdapter {
  readonly portalName = "RemoteOK";
  private adaptee: RemoteOkJobApi;

  constructor(adaptee?: RemoteOkJobApi) {
    this.adaptee = adaptee || new RemoteOkJobApi();
  }

  async fetchJobs(params?: { query?: string; tags?: string[]; limit?: number }): Promise<JobOffer[]> {
    const tag = params?.tags?.[0] || params?.query || "";
    const rawJobs = await this.adaptee.getRemoteJobs(tag, params?.limit || 20);

    return rawJobs.map((raw) => this.mapToDomain(raw));
  }

  async getJobDetails(externalId: string): Promise<JobOffer | null> {
    const all = await this.fetchJobs();
    return all.find((j) => j.id === externalId) || null;
  }

  /**
   * Traducción estructural entre el modelo externo y el modelo de dominio interno.
   */
  private mapToDomain(raw: RemoteOkRawJob): JobOffer {
    const salaryStr = raw.salary_min && raw.salary_max
      ? `$${Math.round(raw.salary_min / 1000)}k - $${Math.round(raw.salary_max / 1000)}k USD`
      : "$80k - $120k USD";

    const titleLower = raw.position.toLowerCase();
    let seniority: JobOffer["seniority"] = "Mid-Level";
    if (titleLower.includes("senior") || titleLower.includes("sr") || titleLower.includes("architect")) {
      seniority = "Senior";
    } else if (titleLower.includes("lead") || titleLower.includes("principal")) {
      seniority = "Lead";
    } else if (titleLower.includes("junior") || titleLower.includes("jr")) {
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
