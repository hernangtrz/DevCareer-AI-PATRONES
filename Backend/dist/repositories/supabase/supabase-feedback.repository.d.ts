import { IFeedbackRepository } from "../feedback.repository";
import { Feedback } from "../../types";
export declare class SupabaseFeedbackRepository implements IFeedbackRepository {
    private supabase;
    constructor(supabaseClient: any);
    create(feedback: Omit<Feedback, "id">): Promise<string>;
    getByInterviewId(interviewId: string, userId: string): Promise<Feedback | null>;
}
