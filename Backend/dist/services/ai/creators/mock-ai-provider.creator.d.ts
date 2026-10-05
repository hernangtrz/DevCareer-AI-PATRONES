import { AIProviderCreator } from "./ai-provider.creator";
import { IAIProvider } from "../ai-provider.interface";
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA TESTING / MOCKS (GoF)
 * ============================================================================
 * Implementa el Factory Method retornando un proveedor simulado sin dependencias de red.
 */
export declare class MockAIProviderCreator extends AIProviderCreator {
    private mockResponses;
    constructor(mockResponses?: Record<string, any>);
    createProvider(): IAIProvider;
}
