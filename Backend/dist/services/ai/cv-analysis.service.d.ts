import { IAIProvider } from "./ai-provider.interface";
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
export declare class CvAnalysisService {
    private aiProvider;
    constructor(aiProvider?: IAIProvider);
    analyze(params: AnalyzeCvAtsParams): Promise<CvAtsAnalysisResult>;
}
