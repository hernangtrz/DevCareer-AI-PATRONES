import { IAIProvider } from "./ai/ai-provider.interface";
export type CvTemplateId = "profesional" | "ejecutivo" | "moderno" | "ats";
export interface CvExperienceInput {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
}
export interface CvEducationInput {
    institution: string;
    degree: string;
    year: string;
}
export interface ImproveCvInput {
    personalInfo?: {
        name?: string;
        headline?: string;
        email?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
    };
    experiences?: CvExperienceInput[];
    skills?: string[];
    education?: CvEducationInput[];
    targetRole?: string;
    language?: "es" | "en" | string;
    profileText?: string;
    translate?: boolean;
    templateId?: CvTemplateId | string;
}
export interface ImprovedCvResult {
    personalInfo: {
        headline: string;
    };
    profileText: string;
    experiences: CvExperienceInput[];
    education: CvEducationInput[];
    skills: string[];
    optimizationMeta?: {
        templateId: CvTemplateId;
        atsSafe: boolean;
        appliedRules: string[];
    };
}
export interface ImproveProfileInput {
    profileText?: string;
    targetRole?: string;
    language?: "es" | "en" | string;
    templateId?: CvTemplateId | string;
}
export interface ImprovedProfileResult {
    refinedProfile: string;
}
/**
 * Servicio especializado en optimización y redacción de currículums (CC-06).
 * Aplica los principios SOLID (SRP / DIP), aislando las reglas de negocio,
 * formateo de prompts por plantilla y sanitización estricta ATS del controlador HTTP.
 */
export declare class CvOptimizationService {
    private aiProvider;
    constructor(aiProvider?: IAIProvider);
    /**
     * Optimiza las secciones completas del CV adaptándose a la plantilla seleccionada
     * (profesional, ejecutivo, moderno o ats) y garantizando higiene de salida.
     */
    improveCv(input: ImproveCvInput): Promise<ImprovedCvResult>;
    /**
     * Perfecciona el resumen profesional / perfil ejecutivo del candidato adaptado a su plantilla.
     */
    improveProfile(input: ImproveProfileInput): Promise<ImprovedProfileResult>;
}
