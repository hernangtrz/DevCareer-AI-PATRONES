import { IInterviewRepository } from "./interview.repository";
import { IFeedbackRepository } from "./feedback.repository";
import { IUserRepository } from "./user.repository";
/**
 * Factoría de Inyección de Dependencias (DIP / OCP):
 * Centraliza la resolución de implementaciones para los repositorios del sistema según la configuración de entorno.
 */
export declare class RepositoryFactory {
    static getInterviewRepository(): IInterviewRepository;
    static getFeedbackRepository(): IFeedbackRepository;
    static getUserRepository(): IUserRepository;
}
