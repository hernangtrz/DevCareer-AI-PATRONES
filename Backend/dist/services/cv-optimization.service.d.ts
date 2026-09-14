import { IAIProvider } from "./ai/ai-provider.interface";
export interface ImproveCvInput {
    personalInfo?: {
        headline?: string;
    };
    experiences?: any[];
    skills?: any[];
    education?: any[];
    targetRole?: string;
    language?: string;
    profileText?: string;
    translate?: boolean;
}
export interface ImprovedCvResult {
    personalInfo: {
        headline: string;
    };
    profileText: string;
    experiences: Array<{
        company: string;
        role: string;
        startDate: string;
        endDate: string;
        bullets: string[];
    }>;
    skills: string[];
}
export interface ImproveProfileInput {
    profileText?: string;
    targetRole?: string;
    language?: string;
}
export interface ImprovedProfileResult {
    refinedProfile: string;
}
/**
 * Servicio especializado en optimización y redacción de currículums (CC-06).
 * Aplica el patrón Service Layer (SRP / DIP), aislando las reglas de negocio,
 * formateo de prompts y estructuración del CV del controlador HTTP.
 */
export declare class CvOptimizationService {
    private aiProvider;
    constructor(aiProvider?: IAIProvider);
    /**
     * Optimiza las secciones completas del CV (headline, perfil, bullets de experiencia y skills).
     */
    improveCv(input: ImproveCvInput): Promise<ImprovedCvResult>;
    /**
     * Perfecciona el resumen profesional / perfil ejecutivo del candidato.
     */
    improveProfile(input: ImproveProfileInput): Promise<ImprovedProfileResult>;
}
