import { Interview } from "../types";

/**
 * Contrato formal para la persistencia de entrevistas (DIP / OCP).
 */
export interface IInterviewRepository {
  getById(id: string): Promise<Interview | null>;
  getByUserId(userId: string): Promise<Interview[]>;
  getLatest(userId: string, limit?: number): Promise<Interview[]>;
  create(interview: Omit<Interview, "id">): Promise<string>;
  update(interview: Interview): Promise<void>;
}
