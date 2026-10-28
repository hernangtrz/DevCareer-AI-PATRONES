import { JobApplication } from "../types/job.types";

export interface IJobApplicationRepository {
  create(application: Omit<JobApplication, "id">): Promise<string>;
  getByUserId(userId: string): Promise<JobApplication[]>;
  getById(id: string): Promise<JobApplication | null>;
  updateStatus(id: string, status: JobApplication["status"]): Promise<void>;
  updateNotes(id: string, notes: string): Promise<void>;
  delete(id: string): Promise<void>;
}
