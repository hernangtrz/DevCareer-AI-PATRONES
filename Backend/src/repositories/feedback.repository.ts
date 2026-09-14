import { Feedback } from "../types";

/**
 * Contrato formal para la persistencia de reportes de feedback (DIP / LSP).
 */
export interface IFeedbackRepository {
  create(feedback: Omit<Feedback, "id">): Promise<string>;
  getByInterviewId(interviewId: string, userId: string): Promise<Feedback | null>;
}
