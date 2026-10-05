import { DataStoreFactory } from "./datastore.factory";
import { IInterviewRepository } from "../interview.repository";
import { IFeedbackRepository } from "../feedback.repository";
import { IUserRepository } from "../user.repository";
/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA CONCRETA PARA AWS DYNAMODB (GoF)
 * ============================================================================
 * Instancia la familia completa de repositorios para AWS DynamoDB.
 */
export declare class DynamoDataStoreFactory extends DataStoreFactory {
    createInterviewRepository(): IInterviewRepository;
    createFeedbackRepository(): IFeedbackRepository;
    createUserRepository(): IUserRepository;
}
