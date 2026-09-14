import { IUserRepository } from "../user.repository";
import { User } from "../../types";

export class SupabaseUserRepository implements IUserRepository {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async getById(uid: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      console.error("[SupabaseUserRepository] getById error:", error);
      return null;
    }
    return data as User | null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[SupabaseUserRepository] getByEmail error:", error);
      return null;
    }
    return data as User | null;
  }

  async create(user: User): Promise<void> {
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
