import { IUserRepository } from "../user.repository";
import { User } from "../../types";
export declare class SupabaseUserRepository implements IUserRepository {
    private supabase;
    constructor(supabaseClient: any);
    getById(uid: string): Promise<User | null>;
    getByEmail(email: string): Promise<User | null>;
    create(user: User): Promise<void>;
}
