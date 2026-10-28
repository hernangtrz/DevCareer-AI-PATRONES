import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { GreenhouseJobApi, GreenhouseRawJob } from "./greenhouse-job.api";
import { JobOffer } from "../../types/job.types";

/**
 * ============================================================================
 * PATRON ADAPTER - CONCRETE ADAPTER (GoF): GreenhouseJobAdapter
 * ============================================================================
 * Adapta las vacantes de GreenhouseJobApi enlazando directamente al formulario
 * de postulacion (#app) donde el aspirante carga su CV y datos de contacto.
 */
export class GreenhouseJobAdapter implements IJobPortalAdapter {
  readonly portalName = "Greenhouse";
  private adaptee: GreenhouseJobApi;

  constructor(adaptee?: GreenhouseJobApi) {
    this.adaptee = adaptee || new GreenhouseJobApi();
  }

  async fetchJobs(params?: { query?: string; tags?: string[]; limit?: number }): Promise<JobOffer[]> {
    const rawJobs = await this.adaptee.getBoardJobs();
    const mapped = rawJobs.map(raw => this.mapToDomain(raw));
    return params?.limit ? mapped.slice(0, params.limit) : mapped;
  }

  async getJobDetails(externalId: string): Promise<JobOffer | null> {
    const jobs = await this.fetchJobs();
    return jobs.find(j => j.id === externalId) || null;
  }

  private mapToDomain(raw: GreenhouseRawJob): JobOffer {
    const techMeta = raw.metadata?.find(m => m.name.toLowerCase().includes("tech"))?.value || "";
    const salaryMeta = raw.metadata?.find(m => m.name.toLowerCase().includes("salary"))?.value || "$120k - $175k USD";
    const skills = techMeta ? techMeta.split(",").map(s => s.trim()) : ["Go", "Ruby", "TypeScript", "React", "Docker", "Kubernetes"];

    const titleLower = raw.title.toLowerCase();
    let seniority: JobOffer["seniority"] = "Mid-Level";
    if (titleLower.includes("staff") || titleLower.includes("principal")) {
      seniority = "Lead";
    } else if (titleLower.includes("senior") || titleLower.includes("sr")) {
      seniority = "Senior";
    } else if (titleLower.includes("junior") || titleLower.includes("jr")) {
      seniority = "Junior";
    }

    // Formulario directo de Greenhouse (#app)
    const applyUrl = raw.absolute_url.includes("#") ? raw.absolute_url : (raw.absolute_url + "#app");

    return {
      id: "gh-" + raw.id,
      title: raw.title,
      company: raw.company_name || "GitLab",
      location: raw.location.name,
      type: "Remote",
      salary: salaryMeta,
      description: raw.content,
      requiredSkills: skills,
      seniority,
      platform: "Greenhouse",
      url: applyUrl,
      createdAt: raw.updated_at,
    };
  }
}
