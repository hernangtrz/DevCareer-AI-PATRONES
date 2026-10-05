import { AIProviderCreator } from "./ai-provider.creator";
import { IAIProvider } from "../ai-provider.interface";
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA OPENAI (GoF)
 * ============================================================================
 * Implementa el Factory Method instanciando el producto concreto `OpenAIAdapter`.
 */
export declare class OpenAIProviderCreator extends AIProviderCreator {
    createProvider(): IAIProvider;
}
