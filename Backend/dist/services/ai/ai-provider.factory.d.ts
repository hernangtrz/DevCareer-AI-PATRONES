import { IAIProvider } from "./ai-provider.interface";
import { AIProviderCreator, GeminiProviderCreator, OpenAIProviderCreator, MockAIProviderCreator } from "./creators";
export { AIProviderCreator, GeminiProviderCreator, OpenAIProviderCreator, MockAIProviderCreator, };
/**
 * ============================================================================
 * PATRÓN FACTORY METHOD: REGISTRY / SELECTOR CENTRALIZADO
 * ============================================================================
 * Administra el creador activo en el sistema según variables de entorno o
 * inyección dinámica de dependencias, invocando el Factory Method correspondiente.
 */
export declare class AIProviderFactory {
    private static activeCreator;
    private static cachedProvider;
    /**
     * Establece explícitamente el creador activo (Inversión de Control / Testing).
     */
    static setCreator(creator: AIProviderCreator): void;
    /**
     * Resuelve y retorna la instancia del proveedor de IA activo invocando el Factory Method.
     */
    static getProvider(): IAIProvider;
    /**
     * Permite inyectar directamente una instancia de proveedor (retrocompatibilidad).
     */
    static setProvider(provider: IAIProvider): void;
}
