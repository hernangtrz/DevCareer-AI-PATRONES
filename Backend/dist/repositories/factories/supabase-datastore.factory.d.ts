import { DataStoreFactory } from "./datastore.factory";
import { IInterviewRepository } from "../interview.repository";
import { IFeedbackRepository } from "../feedback.repository";
import { IUserRepository } from "../user.repository";
/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA CONCRETA PARA SUPABASE / POSTGRESQL (GoF)
 * ============================================================================
 * Instancia la familia completa de repositorios para PostgreSQL/Supabase.
 */
export declare class SupabaseDataStoreFactory extends DataStoreFactory {
    createInterviewRepository(): IInterviewRepository;
    createFeedbackRepository(): IFeedbackRepository;
    createUserRepository(): IUserRepository;
}
