/**
 * ai-provider.interface.ts
 * Contrato de abstracción para proveedores de Inteligencia Artificial (DIP / OCP).
 * Desacopla la lógica de negocio de los SDKs concretos (Gemini, OpenAI, Claude, etc.).
 */

export interface AIContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface AIGenerationOptions {
  temperature?: number;
  model?: string;
}

export interface IAIProvider {
  /**
   * Envía una solicitud al modelo de IA y garantiza una respuesta parseada en formato JSON estricto.
   */
  generateJson<T = any>(
    parts: AIContentPart[],
    options?: AIGenerationOptions
  ): Promise<T>;
}
