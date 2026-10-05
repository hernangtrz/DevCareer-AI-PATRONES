import { AIProviderCreator } from "./ai-provider.creator";
import { IAIProvider } from "../ai-provider.interface";
import { GeminiAdapter } from "../gemini.adapter";

/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA GOOGLE GEMINI (GoF)
 * ============================================================================
 * Implementa el Factory Method instanciando el producto concreto `GeminiAdapter`.
 */
export class GeminiProviderCreator extends AIProviderCreator {
  public createProvider(): IAIProvider {
    return new GeminiAdapter();
  }
}
