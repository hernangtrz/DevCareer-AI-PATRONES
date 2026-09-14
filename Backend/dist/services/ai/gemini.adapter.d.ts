import { IAIProvider, AIContentPart, AIGenerationOptions } from "./ai-provider.interface";
/**
 * Adaptador para Google Gemini AI (Patrón Adapter).
 * Implementa IAIProvider traduciendo peticiones genéricas al protocolo REST de la API de Google Gemini.
 */
export declare class GeminiAdapter implements IAIProvider {
    private defaultModel;
    constructor(defaultModel?: string);
    private getEndpoint;
    /**
     * Limpia y parsea de forma segura respuestas JSON devueltas por modelos de lenguaje.
     */
    sanitizeAndParseJson<T = any>(rawText: string): T;
    generateJson<T = any>(parts: AIContentPart[], options?: AIGenerationOptions): Promise<T>;
}
