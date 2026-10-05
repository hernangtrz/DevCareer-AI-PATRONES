import { DataStoreFactory } from "./datastore.factory";
import { IInterviewRepository } from "../interview.repository";
import { IFeedbackRepository } from "../feedback.repository";
import { IUserRepository } from "../user.repository";
import { DynamoInterviewRepository } from "../dynamo/dynamo-interview.repository";
import { DynamoFeedbackRepository } from "../dynamo/dynamo-feedback.repository";
import { DynamoUserRepository } from "../dynamo/dynamo-user.repository";
import { dynamo } from "../../config/dynamo";

/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA CONCRETA PARA AWS DYNAMODB (GoF)
 * ============================================================================
 * Instancia la familia completa de repositorios para AWS DynamoDB.
 */
export class DynamoDataStoreFactory extends DataStoreFactory {
  public createInterviewRepository(): IInterviewRepository {
    return new DynamoInterviewRepository(dynamo);
  }

  public createFeedbackRepository(): IFeedbackRepository {
    return new DynamoFeedbackRepository(dynamo);
  }

  public createUserRepository(): IUserRepository {
    return new DynamoUserRepository(dynamo);
  }
}
