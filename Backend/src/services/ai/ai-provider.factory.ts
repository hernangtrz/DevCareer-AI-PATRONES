import { IAIProvider } from "./ai-provider.interface";
import { GeminiAdapter } from "./gemini.adapter";

/**
 * Factoría para Proveedores de Inteligencia Artificial (DIP / OCP).
 * Permite resolver la implementación activa del proveedor de IA y sustituirla
 * fácilmente en entornos de pruebas o por nuevos proveedores (OpenAI, Anthropic, etc.).
 */
export class AIProviderFactory {
  private static defaultProvider: IAIProvider | null = null;

  static getProvider(): IAIProvider {
    if (!this.defaultProvider) {
      this.defaultProvider = new GeminiAdapter();
    }
    return this.defaultProvider;
  }

  static setProvider(provider: IAIProvider): void {
    this.defaultProvider = provider;
  }
}
