"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderFactory = exports.MockAIProviderCreator = exports.OpenAIProviderCreator = exports.GeminiProviderCreator = exports.AIProviderCreator = void 0;
const creators_1 = require("./creators");
Object.defineProperty(exports, "AIProviderCreator", { enumerable: true, get: function () { return creators_1.AIProviderCreator; } });
Object.defineProperty(exports, "GeminiProviderCreator", { enumerable: true, get: function () { return creators_1.GeminiProviderCreator; } });
Object.defineProperty(exports, "OpenAIProviderCreator", { enumerable: true, get: function () { return creators_1.OpenAIProviderCreator; } });
Object.defineProperty(exports, "MockAIProviderCreator", { enumerable: true, get: function () { return creators_1.MockAIProviderCreator; } });
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: REGISTRY / SELECTOR CENTRALIZADO
 * ============================================================================
 * Administra el creador activo en el sistema según variables de entorno o
 * inyección dinámica de dependencias, invocando el Factory Method correspondiente.
 */
class AIProviderFactory {
    /**
     * Establece explícitamente el creador activo (Inversión de Control / Testing).
     */
    static setCreator(creator) {
        this.activeCreator = creator;
        this.cachedProvider = null; // Invalida caché al cambiar de creador
    }
    /**
     * Resuelve y retorna la instancia del proveedor de IA activo invocando el Factory Method.
     */
    static getProvider() {
        if (this.cachedProvider) {
            return this.cachedProvider;
        }
        // Resolución dinámica según variable de entorno
        if (process.env.AI_PROVIDER === "openai") {
            this.cachedProvider = new creators_1.OpenAIProviderCreator().createProvider();
        }
        else {
            this.cachedProvider = this.activeCreator.createProvider();
        }
        return this.cachedProvider;
    }
    /**
     * Permite inyectar directamente una instancia de proveedor (retrocompatibilidad).
     */
    static setProvider(provider) {
        this.cachedProvider = provider;
    }
}
exports.AIProviderFactory = AIProviderFactory;
AIProviderFactory.activeCreator = new creators_1.GeminiProviderCreator();
AIProviderFactory.cachedProvider = null;
//# sourceMappingURL=ai-provider.factory.js.map