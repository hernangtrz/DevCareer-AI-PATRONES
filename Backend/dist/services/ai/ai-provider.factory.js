"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderFactory = void 0;
const gemini_adapter_1 = require("./gemini.adapter");
/**
 * Factoría para Proveedores de Inteligencia Artificial (DIP / OCP).
 * Permite resolver la implementación activa del proveedor de IA y sustituirla
 * fácilmente en entornos de pruebas o por nuevos proveedores (OpenAI, Anthropic, etc.).
 */
class AIProviderFactory {
    static getProvider() {
        if (!this.defaultProvider) {
            this.defaultProvider = new gemini_adapter_1.GeminiAdapter();
        }
        return this.defaultProvider;
    }
    static setProvider(provider) {
        this.defaultProvider = provider;
    }
}
exports.AIProviderFactory = AIProviderFactory;
AIProviderFactory.defaultProvider = null;
//# sourceMappingURL=ai-provider.factory.js.map