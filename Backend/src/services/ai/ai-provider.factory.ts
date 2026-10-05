import { IAIProvider } from "./ai-provider.interface";
import {
  AIProviderCreator,
  GeminiProviderCreator,
  OpenAIProviderCreator,
  MockAIProviderCreator,
} from "./creators";

// Re-exportar creadores para retrocompatibilidad
export {
  AIProviderCreator,
  GeminiProviderCreator,
  OpenAIProviderCreator,
  MockAIProviderCreator,
};

/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: REGISTRY / SELECTOR CENTRALIZADO
 * ============================================================================
 * Administra el creador activo en el sistema según variables de entorno o
 * inyección dinámica de dependencias, invocando el Factory Method correspondiente.
 */
export class AIProviderFactory {
  private static activeCreator: AIProviderCreator = new GeminiProviderCreator();
  private static cachedProvider: IAIProvider | null = null;

  /**
   * Establece explícitamente el creador activo (Inversión de Control / Testing).
   */
  public static setCreator(creator: AIProviderCreator): void {
    this.activeCreator = creator;
    this.cachedProvider = null; // Invalida caché al cambiar de creador
  }

  /**
   * Resuelve y retorna la instancia del proveedor de IA activo invocando el Factory Method.
   */
  public static getProvider(): IAIProvider {
    if (this.cachedProvider) {
      return this.cachedProvider;
    }

    // Resolución dinámica según variable de entorno
    if (process.env.AI_PROVIDER === "openai") {
      this.cachedProvider = new OpenAIProviderCreator().createProvider();
    } else {
      this.cachedProvider = this.activeCreator.createProvider();
    }

    return this.cachedProvider;
  }

  /**
   * Permite inyectar directamente una instancia de proveedor (retrocompatibilidad).
   */
  public static setProvider(provider: IAIProvider): void {
    this.cachedProvider = provider;
  }
}
