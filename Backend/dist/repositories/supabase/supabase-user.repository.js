"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseUserRepository = void 0;
class SupabaseUserRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }
    async getById(uid) {
        const { data, error } = await this.supabase
            .from("users")
            .select("*")
            .eq("id", uid)
            .maybeSingle();
        if (error) {
            console.error("[SupabaseUserRepository] getById error:", error);
            return null;
        }
        return data;
    }
    async getByEmail(email) {
        const { data, error } = await this.supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();
        if (error) {
            console.error("[SupabaseUserRepository] getByEmail error:", error);
            return null;
        }
        return data;
    }
    async create(user) {
        const { error } = await this.supabase.from("users").insert({
            id: user.id,
            name: user.name,
            email: user.email,
        });
        if (error) {
            console.error("[SupabaseUserRepository] create error:", error);
            throw error;
        }
    }
}
exports.SupabaseUserRepository = SupabaseUserRepository;
//# sourceMappingURL=supabase-user.repository.js.map