"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseDataStoreFactory = void 0;
const datastore_factory_1 = require("./datastore.factory");
const supabase_interview_repository_1 = require("../supabase/supabase-interview.repository");
const supabase_feedback_repository_1 = require("../supabase/supabase-feedback.repository");
const supabase_user_repository_1 = require("../supabase/supabase-user.repository");
const supabase_1 = require("../../config/supabase");
/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA CONCRETA PARA SUPABASE / POSTGRESQL (GoF)
 * ============================================================================
 * Instancia la familia completa de repositorios para PostgreSQL/Supabase.
 */
class SupabaseDataStoreFactory extends datastore_factory_1.DataStoreFactory {
    createInterviewRepository() {
        return new supabase_interview_repository_1.SupabaseInterviewRepository(supabase_1.supabase);
    }
    createFeedbackRepository() {
        return new supabase_feedback_repository_1.SupabaseFeedbackRepository(supabase_1.supabase);
    }
    createUserRepository() {
        return new supabase_user_repository_1.SupabaseUserRepository(supabase_1.supabase);
    }
}
exports.SupabaseDataStoreFactory = SupabaseDataStoreFactory;
//# sourceMappingURL=supabase-datastore.factory.js.map