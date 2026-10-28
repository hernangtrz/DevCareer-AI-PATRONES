import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { LinkedInJobApi, LinkedInRawPosting } from "./linkedin-job.api";
import { JobOffer } from "../../types/job.types";

/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): LinkedInJobAdapter
 * ============================================================================
 * Adapta el esquema de LinkedInJobApi al contrato estándar IJobPortalAdapter.
 */
export class LinkedInJobAdapter implements IJobPortalAdapter {
  readonly portalName = "LinkedIn";
  private adaptee: LinkedInJobApi;

  constructor(adaptee?: LinkedInJobApi) {
    this.adaptee = adaptee || new LinkedInJobApi();
  }

  async fetchJobs(params?: { query?: string; tags?: string[]; limit?: number }): Promise<JobOffer[]> {
    const rawPostings = await this.adaptee.getLinkedInPostings(params?.query);
    const mapped = rawPostings.map(raw => this.mapToDomain(raw));
    return params?.limit ? mapped.slice(0, params.limit) : mapped;
  }

  async getJobDetails(externalId: string): Promise<JobOffer | null> {
    const jobs = await this.fetchJobs();
    return jobs.find(j => j.id === externalId) || null;
  }

  private mapToDomain(raw: LinkedInRawPosting): JobOffer {
    let seniority: JobOffer["seniority"] = "Mid-Level";
    if (raw.seniorityLevel.toLowerCase().includes("senior") || raw.seniorityLevel.toLowerCase().includes("lead")) {
      seniority = raw.seniorityLevel.toLowerCase().includes("lead") ? "Lead" : "Senior";
    } else if (raw.seniorityLevel.toLowerCase().includes("junior")) {
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
