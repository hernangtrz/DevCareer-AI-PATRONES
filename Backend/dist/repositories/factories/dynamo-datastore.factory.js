"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDataStoreFactory = void 0;
const datastore_factory_1 = require("./datastore.factory");
const dynamo_interview_repository_1 = require("../dynamo/dynamo-interview.repository");
const dynamo_feedback_repository_1 = require("../dynamo/dynamo-feedback.repository");
const dynamo_user_repository_1 = require("../dynamo/dynamo-user.repository");
const dynamo_1 = require("../../config/dynamo");
/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA CONCRETA PARA AWS DYNAMODB (GoF)
 * ============================================================================
 * Instancia la familia completa de repositorios para AWS DynamoDB.
 */
class DynamoDataStoreFactory extends datastore_factory_1.DataStoreFactory {
    createInterviewRepository() {
        return new dynamo_interview_repository_1.DynamoInterviewRepository(dynamo_1.dynamo);
    }
    createFeedbackRepository() {
        return new dynamo_feedback_repository_1.DynamoFeedbackRepository(dynamo_1.dynamo);
    }
    createUserRepository() {
        return new dynamo_user_repository_1.DynamoUserRepository(dynamo_1.dynamo);
    }
}
exports.DynamoDataStoreFactory = DynamoDataStoreFactory;
//# sourceMappingURL=dynamo-datastore.factory.js.map