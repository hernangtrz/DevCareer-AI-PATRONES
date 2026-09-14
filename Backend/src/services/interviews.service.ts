import { RepositoryFactory } from "../repositories/repository.factory";
import { IInterviewRepository } from "../repositories/interview.repository";
import { Interview } from "../types";

/**
 * Servicio de Dominio para Entrevistas (DIP / OCP / SRP).
 * Delega la persistencia al contrato IInterviewRepository obtenido mediante la factoría.
 */
let currentRepo: IInterviewRepository = RepositoryFactory.getInterviewRepository();

export function setInterviewRepository(repo: IInterviewRepository): void {
  currentRepo = repo;
}

export async function getInterviewsByUserId(userId: string): Promise<Interview[]> {
  return currentRepo.getByUserId(userId);
}

export async function getLatestInterviews(
  userId: string,
  limit: number = 20
): Promise<Interview[]> {
  return currentRepo.getLatest(userId, limit);
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  return currentRepo.getById(id);
}

export async function createInterview(
  interview: Omit<Interview, "id">
): Promise<string> {
  return currentRepo.create(interview);
}

export async function updateInterview(
  interview: Interview
): Promise<void> {
  return currentRepo.update(interview);
}
