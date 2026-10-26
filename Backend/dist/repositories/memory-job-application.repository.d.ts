import { IJobApplicationRepository } from "./job-application.repository";
import { JobApplication } from "../types/job.types";
export declare class MemoryJobApplicationRepository implements IJobApplicationRepository {
    private static store;
    create(app: Omit<JobApplication, "id">): Promise<string>;
    getByUserId(userId: string): Promise<JobApplication[]>;
    getById(id: string): Promise<JobApplication | null>;
    updateStatus(id: string, status: JobApplication["status"]): Promise<void>;
    delete(id: string): Promise<void>;
}
