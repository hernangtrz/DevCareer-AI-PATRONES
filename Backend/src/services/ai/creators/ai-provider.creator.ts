import { IAIProvider } from "../ai-provider.interface";

/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR BASE ABSTRACTO (GoF)
 * ============================================================================
 * Declara el método fábrica `createProvider()` que retorna un producto `IAIProvider`.
 * Las subclases concretas implementan este método para instanciar el adaptador correspondiente.
 */
export abstract class AIProviderCreator {
  /**
   * EL FACTORY METHOD (GoF):
   * Cada subclase concreta implementa este método para retornar su producto específico.
   */
  public abstract createProvider(): IAIProvider;

  /**
   * Método de operación auxiliar que utiliza el producto creado por el Factory Method.
   */
  public getProviderInstance(): IAIProvider {
    return this.createProvider();
  }
}
