import { DataStoreFactory } from "./datastore.factory";
import { IInterviewRepository } from "../interview.repository";
import { IFeedbackRepository } from "../feedback.repository";
import { IUserRepository } from "../user.repository";
import { SupabaseInterviewRepository } from "../supabase/supabase-interview.repository";
import { SupabaseFeedbackRepository } from "../supabase/supabase-feedback.repository";
import { SupabaseUserRepository } from "../supabase/supabase-user.repository";
import { supabase } from "../../config/supabase";

/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA CONCRETA PARA SUPABASE / POSTGRESQL (GoF)
 * ============================================================================
 * Instancia la familia completa de repositorios para PostgreSQL/Supabase.
 */
export class SupabaseDataStoreFactory extends DataStoreFactory {
  public createInterviewRepository(): IInterviewRepository {
    return new SupabaseInterviewRepository(supabase);
  }

  public createFeedbackRepository(): IFeedbackRepository {
    return new SupabaseFeedbackRepository(supabase);
  }

  public createUserRepository(): IUserRepository {
    return new SupabaseUserRepository(supabase);
  }
}
