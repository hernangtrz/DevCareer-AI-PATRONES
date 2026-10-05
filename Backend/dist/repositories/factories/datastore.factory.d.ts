import { IInterviewRepository } from "../interview.repository";
import { IFeedbackRepository } from "../feedback.repository";
import { IUserRepository } from "../user.repository";
/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: FÁBRICA ABSTRACTA BASE (GoF)
 * ============================================================================
 * Declara los métodos de creación para cada producto de la familia de persistencia.
 */
export declare abstract class DataStoreFactory {
    abstract createInterviewRepository(): IInterviewRepository;
    abstract createFeedbackRepository(): IFeedbackRepository;
    abstract createUserRepository(): IUserRepository;
}
