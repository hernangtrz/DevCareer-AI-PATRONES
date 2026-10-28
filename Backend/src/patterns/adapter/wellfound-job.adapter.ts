import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { WellfoundJobApi, WellfoundRawJob } from "./wellfound-job.api";
import { JobOffer } from "../../types/job.types";

/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): WellfoundJobAdapter
 * ============================================================================
 * Adapta el esquema de WellfoundJobApi al contrato estándar IJobPortalAdapter.
 */
export class WellfoundJobAdapter implements IJobPortalAdapter {
  readonly portalName = "Wellfound";
  private adaptee: WellfoundJobApi;

  constructor(adaptee?: WellfoundJobApi) {
    this.adaptee = adaptee || new WellfoundJobApi();
  }

  async fetchJobs(params?: { query?: string; tags?: string[]; limit?: number }): Promise<JobOffer[]> {
    const rawJobs = await this.adaptee.getStartupJobs();
    const mapped = rawJobs.map(raw => this.mapToDomain(raw));
    return params?.limit ? mapped.slice(0, params.limit) : mapped;
  }

  async getJobDetails(externalId: string): Promise<JobOffer | null> {
    const jobs = await this.fetchJobs();
    return jobs.find(j => j.id === externalId) || null;
  }

  private mapToDomain(raw: WellfoundRawJob): JobOffer {
    const titleLower = raw.role_title.toLowerCase();
    let seniority: JobOffer["seniority"] = "Mid-Level";
    if (titleLower.includes("founding") || titleLower.includes("senior") || titleLower.includes("lead")) {
      seniority = "Senior";
    } else if (titleLower.includes("junior")) {
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
