import { IFeedbackRepository } from "../repositories/feedback.repository";
import { Feedback } from "../types";
export declare function setFeedbackRepository(repo: IFeedbackRepository): void;
export declare function createFeedbackRecord(feedback: Omit<Feedback, "id">): Promise<string>;
export declare function getFeedbackByInterviewId(interviewId: string, userId: string): Promise<Feedback | null>;
