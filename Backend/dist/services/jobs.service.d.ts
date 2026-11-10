import { JobOffer, JobApplication } from "../types/job.types";
export declare function getJobsForUser(userSkills?: string[], query?: string, platform?: string): Promise<JobOffer[]>;
export declare function getJobById(jobId: string): Promise<JobOffer | null>;
export declare function applyToJob(params: {
    userId: string;
    job: JobOffer;
    notes?: string;
}): Promise<{
    application: JobApplication;
    interviewId?: string;
}>;
export declare function getUserJobApplications(userId: string): Promise<JobApplication[]>;
export declare function updateJobApplicationStatus(id: string, status: JobApplication["status"]): Promise<void>;
export declare function updateJobApplicationNotes(id: string, notes: string): Promise<void>;
export declare function deleteJobApplication(id: string): Promise<void>;
