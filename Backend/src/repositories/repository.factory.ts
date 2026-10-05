import { IInterviewRepository } from "./interview.repository";
import { IFeedbackRepository } from "./feedback.repository";
import { IUserRepository } from "./user.repository";
import {
  DataStoreFactory,
  SupabaseDataStoreFactory,
  DynamoDataStoreFactory,
  MockDataStoreFactory,
} from "./factories";

// Re-exportar para retrocompatibilidad
export {
  DataStoreFactory,
  SupabaseDataStoreFactory,
  DynamoDataStoreFactory,
  MockDataStoreFactory,
};

/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: REGISTRY / SELECTOR CENTRALIZADO
 * ============================================================================
 * Administra la fábrica de persistencia activa en el sistema y delega
 * la resolución de repositorios a la instancia de DataStoreFactory correspondiente.
 */
export class RepositoryFactory {
  private static activeFactory: DataStoreFactory = process.env.SUPABASE_URL
    ? new SupabaseDataStoreFactory()
    : new DynamoDataStoreFactory();

  /**
   * Permite inyectar o cambiar la fábrica de persistencia activa en tiempo de ejecución.
   */
  public static setFactory(factory: DataStoreFactory): void {
    this.activeFactory = factory;
  }

  /**
   * Resuelve el repositorio de entrevistas mediante la Abstract Factory activa.
   */
  public static getInterviewRepository(): IInterviewRepository {
    return this.activeFactory.createInterviewRepository();
  }

  /**
   * Resuelve el repositorio de feedback mediante la Abstract Factory activa.
   */
  public static getFeedbackRepository(): IFeedbackRepository {
    return this.activeFactory.createFeedbackRepository();
  }

  /**
   * Resuelve el repositorio de usuarios mediante la Abstract Factory activa.
   */
  public static getUserRepository(): IUserRepository {
    return this.activeFactory.createUserRepository();
  }
}
