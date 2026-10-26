import { IJobApplicationRepository } from "./job-application.repository";
import { JobApplication } from "../types/job.types";
import { v4 as uuidv4 } from "uuid";

export class MemoryJobApplicationRepository implements IJobApplicationRepository {
  private static store: Map<string, JobApplication> = new Map();

  async create(app: Omit<JobApplication, "id">): Promise<string> {
    const id = "app-" + uuidv4().slice(0, 8);
    const item: JobApplication = { id, ...app };
    MemoryJobApplicationRepository.store.set(id, item);
    return id;
  }

  async getByUserId(userId: string): Promise<JobApplication[]> {
    return Array.from(MemoryJobApplicationRepository.store.values()).filter(
      (a) => a.userId === userId
    );
  }

  async getById(id: string): Promise<JobApplication | null> {
    return MemoryJobApplicationRepository.store.get(id) || null;
  }

  async updateStatus(id: string, status: JobApplication["status"]): Promise<void> {
    const item = MemoryJobApplicationRepository.store.get(id);
    if (item) {
      item.status = status;
    }
  }

  async delete(id: string): Promise<void> {
    MemoryJobApplicationRepository.store.delete(id);
  }
}
