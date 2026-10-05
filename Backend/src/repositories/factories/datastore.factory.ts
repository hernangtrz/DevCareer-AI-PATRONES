import { IInterviewRepository } from "../interview.repository";
import { IFeedbackRepository } from "../feedback.repository";
import { IUserRepository } from "../user.repository";

/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA ABSTRACTA BASE 
 * ============================================================================
 * Declara los métodos de creación para cada producto de la familia de persistencia.
 */
export abstract class DataStoreFactory {
  public abstract createInterviewRepository(): IInterviewRepository;
  public abstract createFeedbackRepository(): IFeedbackRepository;
  public abstract createUserRepository(): IUserRepository;
}
