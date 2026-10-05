import { AIProviderCreator } from "./ai-provider.creator";
import { IAIProvider } from "../ai-provider.interface";
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA GOOGLE GEMINI (GoF)
 * ============================================================================
 * Implementa el Factory Method instanciando el producto concreto `GeminiAdapter`.
 */
export declare class GeminiProviderCreator extends AIProviderCreator {
    createProvider(): IAIProvider;
}
