"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProviderCreator = void 0;
const ai_provider_creator_1 = require("./ai-provider.creator");
const gemini_adapter_1 = require("../gemini.adapter");
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR CONCRETO PARA GOOGLE GEMINI (GoF)
 * ============================================================================
 * Implementa el Factory Method instanciando el producto concreto `GeminiAdapter`.
 */
class GeminiProviderCreator extends ai_provider_creator_1.AIProviderCreator {
    createProvider() {
        return new gemini_adapter_1.GeminiAdapter();
    }
}
exports.GeminiProviderCreator = GeminiProviderCreator;
//# sourceMappingURL=gemini-provider.creator.js.map