import { IInterviewRepository } from "../interview.repository";
import { Interview } from "../../types";
export declare class SupabaseInterviewRepository implements IInterviewRepository {
    private supabase;
    constructor(supabaseClient: any);
    getById(id: string): Promise<Interview | null>;
    getByUserId(userId: string): Promise<Interview[]>;
    getLatest(userId: string, limit?: number): Promise<Interview[]>;
    create(interview: Omit<Interview, "id">): Promise<string>;
    update(interview: Interview): Promise<void>;
}
