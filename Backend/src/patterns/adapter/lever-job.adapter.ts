import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { LeverJobApi, LeverRawPosting } from "./lever-job.api";
import { JobOffer } from "../../types/job.types";

/**
 * ============================================================================
 * PATRON ADAPTER - CONCRETE ADAPTER (GoF): LeverJobAdapter
 * ============================================================================
 * Adapta las vacantes tecnicas de LeverJobApi garantizando que la URL apunte
 * directamente al formulario de postulacion oficial (/apply).
 */
export class LeverJobAdapter implements IJobPortalAdapter {
  readonly portalName = "Lever";
  private adaptee: LeverJobApi;

  constructor(adaptee?: LeverJobApi) {
    this.adaptee = adaptee || new LeverJobApi();
  }

  async fetchJobs(params?: { query?: string; tags?: string[]; limit?: number }): Promise<JobOffer[]> {
    const rawPostings = await this.adaptee.getPostings();
    const mapped = rawPostings.map(raw => this.mapToDomain(raw));
    return params?.limit ? mapped.slice(0, params.limit) : mapped;
  }

  async getJobDetails(externalId: string): Promise<JobOffer | null> {
    const jobs = await this.fetchJobs();
    return jobs.find(j => j.id === externalId) || null;
  }

  private mapToDomain(raw: LeverRawPosting): JobOffer {
    const skillsText = raw.lists?.[0]?.content || "React, TypeScript, Go, Node.js";
    const skills = skillsText.split(",").map(s => s.trim());

    const titleLower = raw.text.toLowerCase();
    let seniority: JobOffer["seniority"] = "Mid-Level";
    if (titleLower.includes("staff") || titleLower.includes("principal")) {
      seniority = "Lead";
    } else if (titleLower.includes("senior") || titleLower.includes("sr")) {
      seniority = "Senior";
    } else if (titleLower.includes("junior")) {
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
