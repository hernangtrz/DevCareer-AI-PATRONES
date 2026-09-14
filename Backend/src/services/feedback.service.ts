import { RepositoryFactory } from "../repositories/repository.factory";
import { IFeedbackRepository } from "../repositories/feedback.repository";
import { Feedback } from "../types";

/**
 * Servicio de Dominio para Feedback (DIP / LSP / SRP).
 * Delega la persistencia al contrato IFeedbackRepository.
 */
let currentRepo: IFeedbackRepository = RepositoryFactory.getFeedbackRepository();

export function setFeedbackRepository(repo: IFeedbackRepository): void {
  currentRepo = repo;
}

export async function createFeedbackRecord(
  feedback: Omit<Feedback, "id">
): Promise<string> {
  return currentRepo.create(feedback);
}

export async function getFeedbackByInterviewId(
  interviewId: string,
  userId: string
): Promise<Feedback | null> {
  return currentRepo.getByInterviewId(interviewId, userId);
}
