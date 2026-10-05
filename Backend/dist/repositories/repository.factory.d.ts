import { IInterviewRepository } from "./interview.repository";
import { IFeedbackRepository } from "./feedback.repository";
import { IUserRepository } from "./user.repository";
import { DataStoreFactory, SupabaseDataStoreFactory, DynamoDataStoreFactory, MockDataStoreFactory } from "./factories";
export { DataStoreFactory, SupabaseDataStoreFactory, DynamoDataStoreFactory, MockDataStoreFactory, };
/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: REGISTRY / SELECTOR CENTRALIZADO
 * ============================================================================
 * Administra la fábrica de persistencia activa en el sistema y delega
 * la resolución de repositorios a la instancia de DataStoreFactory correspondiente.
 */
export declare class RepositoryFactory {
    private static activeFactory;
    /**
     * Permite inyectar o cambiar la fábrica de persistencia activa en tiempo de ejecución.
     */
    static setFactory(factory: DataStoreFactory): void;
    /**
     * Resuelve el repositorio de entrevistas mediante la Abstract Factory activa.
     */
    static getInterviewRepository(): IInterviewRepository;
    /**
     * Resuelve el repositorio de feedback mediante la Abstract Factory activa.
     */
    static getFeedbackRepository(): IFeedbackRepository;
    /**
     * Resuelve el repositorio de usuarios mediante la Abstract Factory activa.
     */
    static getUserRepository(): IUserRepository;
}
