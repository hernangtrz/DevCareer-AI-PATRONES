"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIProviderCreator = void 0;
const ai_provider_creator_1 = require("./ai-provider.creator");
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA TESTING / MOCKS (GoF)
 * ============================================================================
 * Implementa el Factory Method retornando un proveedor simulado sin dependencias de red.
 */
class MockAIProviderCreator extends ai_provider_creator_1.AIProviderCreator {
    constructor(mockResponses = {}) {
        super();
        this.mockResponses = mockResponses;
    }
    createProvider() {
        const responses = this.mockResponses;
        return {
            async generateJson(parts, _options) {
                return (responses.default || {
                    totalScore: 90,
                    status: "mock_success",
                    message: "Respuesta simulada mediante MockAIProvider",
                });
            },
        };
    }
}
exports.MockAIProviderCreator = MockAIProviderCreator;
//# sourceMappingURL=mock-ai-provider.creator.js.map