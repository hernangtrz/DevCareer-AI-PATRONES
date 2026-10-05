import { AIProviderCreator } from "./ai-provider.creator";
import { IAIProvider } from "../ai-provider.interface";

/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA TESTING / MOCKS (GoF)
 * ============================================================================
 * Implementa el Factory Method retornando un proveedor simulado sin dependencias de red.
 */
export class MockAIProviderCreator extends AIProviderCreator {
  constructor(private mockResponses: Record<string, any> = {}) {
    super();
  }

  public createProvider(): IAIProvider {
    const responses = this.mockResponses;
    return {
      async generateJson<T = any>(parts: any, _options: any): Promise<T> {
        return (responses.default || {
          totalScore: 90,
          status: "mock_success",
          message: "Respuesta simulada mediante MockAIProvider",
        }) as T;
      },
    };
  }
}
