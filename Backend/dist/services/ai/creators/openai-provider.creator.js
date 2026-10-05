"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProviderCreator = void 0;
const ai_provider_creator_1 = require("./ai-provider.creator");
const openai_adapter_1 = require("../openai.adapter");
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA OPENAI (GoF)
 * ============================================================================
 * Implementa el Factory Method instanciando el producto concreto `OpenAIAdapter`.
 */
class OpenAIProviderCreator extends ai_provider_creator_1.AIProviderCreator {
    createProvider() {
        return new openai_adapter_1.OpenAIAdapter();
    }
}
exports.OpenAIProviderCreator = OpenAIProviderCreator;
//# sourceMappingURL=openai-provider.creator.js.map