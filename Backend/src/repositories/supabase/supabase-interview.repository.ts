import { IInterviewRepository } from "../interview.repository";
import { Interview } from "../../types";
import { v4 as uuidv4 } from "uuid";

function mapInterviewFromDb(row: any): Interview {
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

function mapInterviewToDb(interview: Partial<Interview>): any {
  const row: any = {};
  if (interview.id !== undefined) row.id = interview.id;
  if (interview.role !== undefined) row.role = interview.role;
  if (interview.level !== undefined) row.level = interview.level;
  if (interview.questions !== undefined) row.questions = interview.questions;
  if (interview.techstack !== undefined) row.techstack = interview.techstack;
  if (interview.createdAt !== undefined) row.created_at = interview.createdAt;
  if (interview.userId !== undefined) row.user_id = interview.userId;
  if (interview.type !== undefined) row.type = interview.type;
  if (interview.finalized !== undefined) row.finalized = interview.finalized;
  if (interview.coverImage !== undefined) row.cover_image = interview.coverImage;
  return row;
}

export class SupabaseInterviewRepository implements IInterviewRepository {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async getById(id: string): Promise<Interview | null> {
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

  async getByUserId(userId: string): Promise<Interview[]> {
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

  async getLatest(userId: string, limit: number = 20): Promise<Interview[]> {
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

  async create(interview: Omit<Interview, "id">): Promise<string> {
    const id = uuidv4();
    const item: Interview = { id, ...interview };
    const row = mapInterviewToDb(item);

    const { error } = await this.supabase.from("interviews").insert(row);
    if (error) {
      console.error("[SupabaseInterviewRepository] create error:", error);
      throw error;
    }
    return id;
  }

  async update(interview: Interview): Promise<void> {
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
