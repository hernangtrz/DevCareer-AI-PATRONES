import {
  IAIProvider,
  AIContentPart,
  AIGenerationOptions,
} from "./ai-provider.interface";

/**
 * Implementación de infraestructura para Google Gemini AI (DIP / OCP).
 * Implementa el contrato IAIProvider traduciendo peticiones genéricas al protocolo REST de la API de Google Gemini.
 */
export class GeminiAdapter implements IAIProvider {
  private defaultModels: string[];

  constructor(defaultModel = "gemini-3.5-flash-lite") {
    this.defaultModels = [
      defaultModel,
      "gemini-3.6-flash",
      "gemini-flash-latest",
    ];
  }

  private getEndpoint(model: string): string {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Falta la variable de entorno GOOGLE_GENERATIVE_AI_API_KEY.");
    }
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  }

  /**
   * Limpia y parsea de forma segura respuestas JSON devueltas por modelos de lenguaje.
   */
  public sanitizeAndParseJson<T = any>(rawText: string): T {
    let cleaned = rawText.trim();

    // Eliminar bloques de código markdown
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Extraer el primer bloque JSON delimitado por { } o [ ] si el modelo añadió texto adicional
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");

    if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    } else if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (err: any) {
      console.error("[GeminiAdapter] Error parseando JSON de Gemini. Raw text:", rawText);
      throw new Error(`Respuesta inválida de IA: no se pudo parsear el JSON generado (${err.message}).`);
    }
  }

  async generateJson<T = any>(
    parts: AIContentPart[],
    options: AIGenerationOptions = {}
  ): Promise<T> {
    const candidateModels = options.model
      ? [options.model, ...this.defaultModels.filter((m) => m !== options.model)]
      : this.defaultModels;

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
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
          console.warn(`[GeminiAdapter] Falló modelo ${model} (${res.status}): ${errorBody.slice(0, 150)}. Intentando siguiente modelo...`);
          lastError = new Error(`Gemini API Error (${res.status}): ${errorBody.slice(0, 300)}`);
          continue;
        }

        const data = (await res.json()) as any;
        const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!rawText) {
          console.warn(`[GeminiAdapter] Modelo ${model} devolvió respuesta vacía. Intentando siguiente...`);
          lastError = new Error("Gemini devolvió una respuesta vacía.");
          continue;
        }

        return this.sanitizeAndParseJson<T>(rawText);
      } catch (err: any) {
        console.warn(`[GeminiAdapter] Excepción con modelo ${model}:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini configurado.");
  }
}
