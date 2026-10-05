"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIAdapter = void 0;
/**
 * Implementación de infraestructura para OpenAI (GPT-4o / GPT-4o-mini).
 * Producto Concreto dentro del Patrón Factory Method (GoF).
 */
class OpenAIAdapter {
    constructor(apiKey = process.env.OPENAI_API_KEY || "", defaultModel = "gpt-4o-mini") {
        this.apiKey = apiKey;
        this.defaultModel = defaultModel;
    }
    /**
     * Limpia y parsea respuestas JSON devueltas por modelos de lenguaje.
     */
    sanitizeAndParseJson(rawText) {
        let cleaned = rawText.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        }
        else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
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
            console.error("[OpenAIAdapter] Error parseando JSON:", rawText);
            throw new Error(`Respuesta inválida de OpenAI: no se pudo parsear el JSON generado (${err.message}).`);
        }
    }
    async generateJson(parts, options = {}) {
        if (!this.apiKey) {
            throw new Error("Falta la variable de entorno OPENAI_API_KEY para utilizar el adaptador de OpenAI.");
        }
        const promptText = parts.map((p) => p.text || "").join("\n");
        const model = options.model || this.defaultModel;
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                temperature: options.temperature ?? 0.3,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "You are a professional technical evaluation and career AI. Always respond with valid, strictly formatted JSON.",
                    },
                    {
                        role: "user",
                        content: promptText,
                    },
                ],
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("[OpenAIAdapter] Error en llamada a OpenAI:", response.status, errorText);
            throw new Error(`Error en API de OpenAI (${response.status}): ${response.statusText}`);
        }
        const data = (await response.json());
        const content = data.choices?.[0]?.message?.content || "{}";
        return this.sanitizeAndParseJson(content);
    }
}
exports.OpenAIAdapter = OpenAIAdapter;
//# sourceMappingURL=openai.adapter.js.map