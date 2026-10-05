import { AIProviderCreator } from "./ai-provider.creator";
import { IAIProvider } from "../ai-provider.interface";
import { OpenAIAdapter } from "../openai.adapter";

/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA OPENAI (GoF)
 * ============================================================================
 * Implementa el Factory Method instanciando el producto concreto `OpenAIAdapter`.
 */
export class OpenAIProviderCreator extends AIProviderCreator {
  public createProvider(): IAIProvider {
    return new OpenAIAdapter();
  }
}
