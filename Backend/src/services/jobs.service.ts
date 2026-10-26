import { JobOffer, JobApplication } from "../types/job.types";
import { JobPortalAdapterRegistry } from "../patterns/adapter";
import { JobApplicationFacade } from "../patterns/facade";
import { MemoryJobApplicationRepository } from "../repositories/memory-job-application.repository";

const appRepo = new MemoryJobApplicationRepository();
const jobFacade = new JobApplicationFacade(appRepo);

export async function getJobsForUser(
  userSkills: string[] = ["TypeScript", "React", "Node.js"],
  query?: string,
  platform?: string
): Promise<JobOffer[]> {
  const registry = JobPortalAdapterRegistry.getInstance();
  let adapters = registry.getAllAdapters();

  if (platform) {
    const selected = registry.getAdapter(platform);
    if (selected) adapters = [selected];
  }

  const allJobs: JobOffer[] = [];
  for (const adapter of adapters) {
    try {
      const jobs = await adapter.fetchJobs({ query });
      allJobs.push(...jobs);
    } catch (e) {
      console.error(`Error obteniendo empleos de ${adapter.portalName}:`, e);
    }
  }

  // Calcular Match Score inteligente contra el perfil del usuario
  return allJobs.map((job) => {
    const requiredLower = job.requiredSkills.map((s) => s.toLowerCase());
    const matched = userSkills.filter((skill) =>
      requiredLower.some((req) => req.includes(skill.toLowerCase()) || skill.toLowerCase().includes(req))
    );
    const missing = job.requiredSkills.filter(
      (req) => !userSkills.some((s) => s.toLowerCase().includes(req.toLowerCase()))
    );

    const matchRatio = job.requiredSkills.length > 0 ? matched.length / job.requiredSkills.length : 0.7;
    const matchScore = Math.min(100, Math.max(50, Math.round(matchRatio * 50 + 50)));

    return {
      ...job,
      matchScore,
      matchedSkills: matched,
      missingSkills: missing,
    };
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

export async function getJobById(jobId: string): Promise<JobOffer | null> {
  const registry = JobPortalAdapterRegistry.getInstance();
  for (const adapter of registry.getAllAdapters()) {
    const job = await adapter.getJobDetails(jobId);
    if (job) return job;
  }
  return null;
}

export async function applyToJob(params: {
  userId: string;
  job: JobOffer;
  userSkills?: string[];
  userExperienceSummary?: string;
  notes?: string;
}) {
  return jobFacade.processCompleteApplication({
    userId: params.userId,
    job: params.job,
    userSkills: params.userSkills,
    userExperienceSummary: params.userExperienceSummary,
    createMockInterview: true,
    notes: params.notes,
  });
}

export async function getUserJobApplications(userId: string): Promise<JobApplication[]> {
  return appRepo.getByUserId(userId);
}
