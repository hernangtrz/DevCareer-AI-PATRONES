import { IAIProvider } from "./ai-provider.interface";
/**
 * Factoría para Proveedores de Inteligencia Artificial (DIP / OCP).
 * Permite resolver la implementación activa del proveedor de IA y sustituirla
 * fácilmente en entornos de pruebas o por nuevos proveedores (OpenAI, Anthropic, etc.).
 */
export declare class AIProviderFactory {
    private static defaultProvider;
    static getProvider(): IAIProvider;
    static setProvider(provider: IAIProvider): void;
}
