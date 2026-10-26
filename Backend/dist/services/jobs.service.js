"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobsForUser = getJobsForUser;
exports.getJobById = getJobById;
exports.applyToJob = applyToJob;
exports.getUserJobApplications = getUserJobApplications;
const adapter_1 = require("../patterns/adapter");
const facade_1 = require("../patterns/facade");
const memory_job_application_repository_1 = require("../repositories/memory-job-application.repository");
const appRepo = new memory_job_application_repository_1.MemoryJobApplicationRepository();
const jobFacade = new facade_1.JobApplicationFacade(appRepo);
async function getJobsForUser(userSkills = ["TypeScript", "React", "Node.js"], query, platform) {
    const registry = adapter_1.JobPortalAdapterRegistry.getInstance();
    let adapters = registry.getAllAdapters();
    if (platform) {
        const selected = registry.getAdapter(platform);
        if (selected)
            adapters = [selected];
    }
    const allJobs = [];
    for (const adapter of adapters) {
        try {
            const jobs = await adapter.fetchJobs({ query });
            allJobs.push(...jobs);
        }
        catch (e) {
            console.error(`Error obteniendo empleos de ${adapter.portalName}:`, e);
        }
    }
    // Calcular Match Score inteligente contra el perfil del usuario
    return allJobs.map((job) => {
        const requiredLower = job.requiredSkills.map((s) => s.toLowerCase());
        const matched = userSkills.filter((skill) => requiredLower.some((req) => req.includes(skill.toLowerCase()) || skill.toLowerCase().includes(req)));
        const missing = job.requiredSkills.filter((req) => !userSkills.some((s) => s.toLowerCase().includes(req.toLowerCase())));
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
async function getJobById(jobId) {
    const registry = adapter_1.JobPortalAdapterRegistry.getInstance();
    for (const adapter of registry.getAllAdapters()) {
        const job = await adapter.getJobDetails(jobId);
        if (job)
            return job;
    }
    return null;
}
async function applyToJob(params) {
    return jobFacade.processCompleteApplication({
        userId: params.userId,
        job: params.job,
        userSkills: params.userSkills,
        userExperienceSummary: params.userExperienceSummary,
        createMockInterview: true,
        notes: params.notes,
    });
}
async function getUserJobApplications(userId) {
    return appRepo.getByUserId(userId);
}
//# sourceMappingURL=jobs.service.js.map