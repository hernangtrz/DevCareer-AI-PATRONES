"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderCreator = void 0;
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: CREADOR BASE ABSTRACTO (GoF)
 * ============================================================================
 * Declara el método fábrica `createProvider()` que retorna un producto `IAIProvider`.
 * Las subclases concretas implementan este método para instanciar el adaptador correspondiente.
 */
class AIProviderCreator {
    /**
     * Método de operación auxiliar que utiliza el producto creado por el Factory Method.
     */
    getProviderInstance() {
        return this.createProvider();
    }
}
exports.AIProviderCreator = AIProviderCreator;
//# sourceMappingURL=ai-provider.creator.js.map