"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseInterviewRepository = void 0;
const uuid_1 = require("uuid");
function mapInterviewFromDb(row) {
    return {
        id: row.id,
        role: row.role,
        level: row.level,
        questions: row.questions || [],
        techstack: row.techstack || [],
        createdAt: row.created_at || new Date().toISOString(),
        userId: row.user_id,
        type: row.type,
        finalized: !!row.finalized,
        coverImage: row.cover_image,
    };
}
function mapInterviewToDb(interview) {
    const row = {};
    if (interview.id !== undefined)
        row.id = interview.id;
    if (interview.role !== undefined)
        row.role = interview.role;
    if (interview.level !== undefined)
        row.level = interview.level;
    if (interview.questions !== undefined)
        row.questions = interview.questions;
    if (interview.techstack !== undefined)
        row.techstack = interview.techstack;
    if (interview.createdAt !== undefined)
        row.created_at = interview.createdAt;
    if (interview.userId !== undefined)
        row.user_id = interview.userId;
    if (interview.type !== undefined)
        row.type = interview.type;
    if (interview.finalized !== undefined)
        row.finalized = interview.finalized;
    if (interview.coverImage !== undefined)
        row.cover_image = interview.coverImage;
    return row;
}
class SupabaseInterviewRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }
    async getById(id) {
        const { data, error } = await this.supabase
            .from("interviews")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) {
            console.error("[SupabaseInterviewRepository] getById error:", error);
            return null;
        }
        return data ? mapInterviewFromDb(data) : null;
    }
    async getByUserId(userId) {
        const { data, error } = await this.supabase
            .from("interviews")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) {
            console.error("[SupabaseInterviewRepository] getByUserId error:", error);
            return [];
        }
        return (data || []).map(mapInterviewFromDb);
    }
    async getLatest(userId, limit = 20) {
        const { data, error } = await this.supabase
            .from("interviews")
            .select("*")
            .eq("finalized", true)
            .neq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);
        if (error) {
            console.error("[SupabaseInterviewRepository] getLatest error:", error);
            return [];
        }
        return (data || []).map(mapInterviewFromDb);
    }
    async create(interview) {
        const id = (0, uuid_1.v4)();
        const item = { id, ...interview };
        const row = mapInterviewToDb(item);
        const { error } = await this.supabase.from("interviews").insert(row);
        if (error) {
            console.error("[SupabaseInterviewRepository] create error:", error);
            throw error;
        }
        return id;
    }
    async update(interview) {
        const row = mapInterviewToDb(interview);
        const { error } = await this.supabase
            .from("interviews")
            .update(row)
            .eq("id", interview.id);
        if (error) {
            console.error("[SupabaseInterviewRepository] update error:", error);
            throw error;
        }
    }
}
exports.SupabaseInterviewRepository = SupabaseInterviewRepository;
//# sourceMappingURL=supabase-interview.repository.js.map