"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiAdapter = void 0;
/**
 * Adaptador para Google Gemini AI (Patrón Adapter).
 * Implementa IAIProvider traduciendo peticiones genéricas al protocolo REST de la API de Google Gemini.
 */
class GeminiAdapter {
    constructor(defaultModel = "gemini-3.1-flash-lite") {
        this.defaultModel = defaultModel;
    }
    getEndpoint(model) {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            throw new Error("Falta la variable de entorno GOOGLE_GENERATIVE_AI_API_KEY.");
        }
        return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    }
    /**
     * Limpia y parsea de forma segura respuestas JSON devueltas por modelos de lenguaje.
     */
    sanitizeAndParseJson(rawText) {
        let cleaned = rawText.trim();
        // Eliminar bloques de código markdown
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        }
        else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        // Extraer el primer bloque JSON delimitado por { } o [ ] si el modelo añadió texto adicional
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        const firstBracket = cleaned.indexOf("[");
        const lastBracket = cleaned.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            cleaned = cleaned.substring(firstBracket, lastBracket + 1);
        }
        else if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        try {
            return JSON.parse(cleaned);
        }
        catch (err) {
            console.error("[GeminiAdapter] Error parseando JSON de Gemini. Raw text:", rawText);
            throw new Error(`Respuesta inválida de IA: no se pudo parsear el JSON generado (${err.message}).`);
        }
    }
    async generateJson(parts, options = {}) {
        const model = options.model || this.defaultModel;
        const endpoint = this.getEndpoint(model);
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    temperature: options.temperature ?? 0.3,
                    responseMimeType: "application/json",
                },
            }),
        });
        if (!res.ok) {
            const errorBody = await res.text().catch(() => "");
            throw new Error(`Gemini API Error (${res.status}): ${errorBody.slice(0, 300)}`);
        }
        const data = (await res.json());
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!rawText) {
            throw new Error("Gemini devolvió una respuesta vacía.");
        }
        return this.sanitizeAndParseJson(rawText);
    }
}
exports.GeminiAdapter = GeminiAdapter;
//# sourceMappingURL=gemini.adapter.js.map