import { IAIProvider, AIContentPart, AIGenerationOptions } from "./ai-provider.interface";
/**
 * Implementación de infraestructura para OpenAI (GPT-4o / GPT-4o-mini).
 * Producto Concreto dentro del Patrón Factory Method (GoF).
 */
export declare class OpenAIAdapter implements IAIProvider {
    private apiKey;
    private defaultModel;
    constructor(apiKey?: string, defaultModel?: string);
    /**
     * Limpia y parsea respuestas JSON devueltas por modelos de lenguaje.
     */
    sanitizeAndParseJson<T = any>(rawText: string): T;
    generateJson<T = any>(parts: AIContentPart[], options?: AIGenerationOptions): Promise<T>;
}
