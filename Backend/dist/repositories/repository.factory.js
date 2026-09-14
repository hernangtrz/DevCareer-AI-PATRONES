"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryFactory = void 0;
const supabase_interview_repository_1 = require("./supabase/supabase-interview.repository");
const dynamo_interview_repository_1 = require("./dynamo/dynamo-interview.repository");
const supabase_feedback_repository_1 = require("./supabase/supabase-feedback.repository");
const dynamo_feedback_repository_1 = require("./dynamo/dynamo-feedback.repository");
const supabase_user_repository_1 = require("./supabase/supabase-user.repository");
const dynamo_user_repository_1 = require("./dynamo/dynamo-user.repository");
const supabase_1 = require("../config/supabase");
const dynamo_1 = require("../config/dynamo");
/**
 * Factoría de Inyección de Dependencias (DIP / OCP):
 * Centraliza la resolución de implementaciones para los repositorios del sistema según la configuración de entorno.
 */
class RepositoryFactory {
    static getInterviewRepository() {
        if (process.env.SUPABASE_URL) {
            return new supabase_interview_repository_1.SupabaseInterviewRepository(supabase_1.supabase);
        }
        return new dynamo_interview_repository_1.DynamoInterviewRepository(dynamo_1.dynamo);
    }
    static getFeedbackRepository() {
        if (process.env.SUPABASE_URL) {
            return new supabase_feedback_repository_1.SupabaseFeedbackRepository(supabase_1.supabase);
        }
        return new dynamo_feedback_repository_1.DynamoFeedbackRepository(dynamo_1.dynamo);
    }
    static getUserRepository() {
        if (process.env.SUPABASE_URL) {
            return new supabase_user_repository_1.SupabaseUserRepository(supabase_1.supabase);
        }
        return new dynamo_user_repository_1.DynamoUserRepository(dynamo_1.dynamo);
    }
}
exports.RepositoryFactory = RepositoryFactory;
//# sourceMappingURL=repository.factory.js.map