export interface JobOffer {
    id: string;
    title: string;
    company: string;
    location: string;
    type: "Full-time" | "Part-time" | "Contract" | "Remote";
    salary?: string;
    currency?: string;
    description: string;
    requiredSkills: string[];
    seniority: "Junior" | "Mid-Level" | "Senior" | "Lead";
    platform: "RemoteOK" | "Internal" | "LinkedIn" | "Wellfound" | "Greenhouse" | "Lever" | string;
    url?: string;
    matchScore?: number;
    matchedSkills?: string[];
    missingSkills?: string[];
    createdAt: string;
}
export interface JobApplication {
    id: string;
    userId: string;
    jobId: string;
    jobTitle: string;
    company: string;
    platform: string;
    location: string;
    salary?: string;
    appliedAt: string;
    status: "applied" | "interviewing" | "offered" | "rejected";
    coverLetter?: string;
    adaptedResumeSummary?: string;
    matchScore?: number;
    interviewId?: string;
    notes?: string;
}
export interface CreateJobApplicationInput {
    userId: string;
    job: JobOffer;
    coverLetter?: string;
    adaptedResumeSummary?: string;
    notes?: string;
}
