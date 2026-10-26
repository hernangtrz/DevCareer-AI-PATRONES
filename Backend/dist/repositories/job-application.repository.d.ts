import { JobApplication } from "../types/job.types";
/**
 * Contrato formal para la persistencia de postulaciones a empleo (DIP / OCP).
 */
export interface IJobApplicationRepository {
    create(application: Omit<JobApplication, "id">): Promise<string>;
    getByUserId(userId: string): Promise<JobApplication[]>;
    getById(id: string): Promise<JobApplication | null>;
    updateStatus(id: string, status: JobApplication["status"]): Promise<void>;
    delete(id: string): Promise<void>;
}
