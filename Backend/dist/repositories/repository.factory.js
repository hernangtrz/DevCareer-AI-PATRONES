"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryFactory = exports.MockDataStoreFactory = exports.DynamoDataStoreFactory = exports.SupabaseDataStoreFactory = exports.DataStoreFactory = void 0;
const factories_1 = require("./factories");
Object.defineProperty(exports, "DataStoreFactory", { enumerable: true, get: function () { return factories_1.DataStoreFactory; } });
Object.defineProperty(exports, "SupabaseDataStoreFactory", { enumerable: true, get: function () { return factories_1.SupabaseDataStoreFactory; } });
Object.defineProperty(exports, "DynamoDataStoreFactory", { enumerable: true, get: function () { return factories_1.DynamoDataStoreFactory; } });
Object.defineProperty(exports, "MockDataStoreFactory", { enumerable: true, get: function () { return factories_1.MockDataStoreFactory; } });
/**
 * ============================================================================
 * PATRÓN ABSTRACT FACTORY: REGISTRY / SELECTOR CENTRALIZADO
 * ============================================================================
 * Administra la fábrica de persistencia activa en el sistema y delega
 * la resolución de repositorios a la instancia de DataStoreFactory correspondiente.
 */
class RepositoryFactory {
    /**
     * Permite inyectar o cambiar la fábrica de persistencia activa en tiempo de ejecución.
     */
    static setFactory(factory) {
        this.activeFactory = factory;
    }
    /**
     * Resuelve el repositorio de entrevistas mediante la Abstract Factory activa.
     */
    static getInterviewRepository() {
        return this.activeFactory.createInterviewRepository();
    }
    /**
     * Resuelve el repositorio de feedback mediante la Abstract Factory activa.
     */
    static getFeedbackRepository() {
        return this.activeFactory.createFeedbackRepository();
    }
    /**
     * Resuelve el repositorio de usuarios mediante la Abstract Factory activa.
     */
    static getUserRepository() {
        return this.activeFactory.createUserRepository();
    }
}
exports.RepositoryFactory = RepositoryFactory;
RepositoryFactory.activeFactory = process.env.SUPABASE_URL
    ? new factories_1.SupabaseDataStoreFactory()
    : new factories_1.DynamoDataStoreFactory();
//# sourceMappingURL=repository.factory.js.map