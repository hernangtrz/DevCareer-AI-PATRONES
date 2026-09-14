import { IAIProvider } from "./ai-provider.interface";
import { AIProviderFactory } from "./ai-provider.factory";

export interface CvAtsAnalysisResult {
  score: number;
  summary: string;
  breakdown: {
    keywords: number;
    formatting: number;
    grammar: number;
    impact: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: Array<{
    category: "keywords" | "formatting" | "grammar" | "impact" | "structure";
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
  }>;
}

export interface AnalyzeCvAtsParams {
  jobDescription: string;
  cvText?: string;
  pdfBase64?: string;
}

/**
 * Servicio especializado en análisis de compatibilidad ATS de currículums (SRP).
 * Procesa entradas multimodales (PDF en base64 o texto plano) contrastadas con ofertas laborales.
 */
export class CvAnalysisService {
  constructor(private aiProvider: IAIProvider = AIProviderFactory.getProvider()) {}

  async analyze(params: AnalyzeCvAtsParams): Promise<CvAtsAnalysisResult> {
    const systemPrompt = `Eres un sistema experto en reclutamiento tecnológico y análisis de compatibilidad ATS (Applicant Tracking System).
Tu tarea es analizar cuán compatible es el CURRÍCULUM adjunto con la OFERTA DE EMPLEO proporcionada.

─── DESCRIPCIÓN DE LA OFERTA DE EMPLEO ───
${params.jobDescription.slice(0, 4000)}

─── INSTRUCCIONES DE ANÁLISIS ───
1. Lee el currículum adjunto y analiza con precisión qué tan bien encaja con la oferta.
2. Identifica las palabras clave técnicas y habilidades presentes en la oferta y si están en el CV.
3. Evalúa el formato, gramática, impacto de los logros y uso de métricas.
4. Genera sugerencias concretas y accionables para mejorar el CV.
5. El idioma de toda la respuesta debe ser ESPAÑOL.

Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:
{
  "score": <número 0-100 que representa compatibilidad ATS global>,
  "summary": "<resumen ejecutivo de 2-3 oraciones sobre la compatibilidad del candidato>",
  "breakdown": {
    "keywords": <0-100, porcentaje de palabras clave de la oferta presentes en el CV>,
    "formatting": <0-100, calidad del formato y legibilidad del CV>,
    "grammar": <0-100, gramática, claridad y estilo de redacción>,
    "impact": <0-100, uso de métricas, logros cuantificables y verbos de acción>
  },
  "matchedKeywords": [<lista de keywords del anuncio que SÍ están en el CV, máximo 12>],
  "missingKeywords": [<lista de keywords críticas del anuncio que NO están en el CV, máximo 10>],
  "suggestions": [
    {
      "category": "<una de: 'keywords' | 'formatting' | 'grammar' | 'impact' | 'structure'>",
      "title": "<título corto y accionable>",
      "description": "<explicación detallada de cómo mejorar>",
      "severity": "<una de: 'high' | 'medium' | 'low'>"
    }
  ]
}`;

    if (params.pdfBase64) {
      return this.aiProvider.generateJson<CvAtsAnalysisResult>(
        [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: params.pdfBase64,
            },
          },
        ],
        { temperature: 0.2 }
      );
    } else {
      const textPrompt = `${systemPrompt}\n\n─── CURRÍCULUM DEL CANDIDATO (TEXTO) ───\n${(params.cvText || "").slice(0, 8000)}`;
      return this.aiProvider.generateJson<CvAtsAnalysisResult>(
        [{ text: textPrompt }],
        { temperature: 0.2 }
      );
    }
  }
}
