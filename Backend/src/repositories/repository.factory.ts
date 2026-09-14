import { IInterviewRepository } from "./interview.repository";
import { IFeedbackRepository } from "./feedback.repository";
import { IUserRepository } from "./user.repository";
import { SupabaseInterviewRepository } from "./supabase/supabase-interview.repository";
import { DynamoInterviewRepository } from "./dynamo/dynamo-interview.repository";
import { SupabaseFeedbackRepository } from "./supabase/supabase-feedback.repository";
import { DynamoFeedbackRepository } from "./dynamo/dynamo-feedback.repository";
import { SupabaseUserRepository } from "./supabase/supabase-user.repository";
import { DynamoUserRepository } from "./dynamo/dynamo-user.repository";
import { supabase } from "../config/supabase";
import { dynamo } from "../config/dynamo";

/**
 * Factoría de Inyección de Dependencias (DIP / OCP):
 * Centraliza la resolución de implementaciones para los repositorios del sistema según la configuración de entorno.
 */
export class RepositoryFactory {
  static getInterviewRepository(): IInterviewRepository {
    if (process.env.SUPABASE_URL) {
      return new SupabaseInterviewRepository(supabase);
    }
    return new DynamoInterviewRepository(dynamo);
  }

  static getFeedbackRepository(): IFeedbackRepository {
    if (process.env.SUPABASE_URL) {
      return new SupabaseFeedbackRepository(supabase);
    }
    return new DynamoFeedbackRepository(dynamo);
  }

  static getUserRepository(): IUserRepository {
    if (process.env.SUPABASE_URL) {
      return new SupabaseUserRepository(supabase);
    }
    return new DynamoUserRepository(dynamo);
  }
}
