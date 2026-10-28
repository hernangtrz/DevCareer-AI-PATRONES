/**
 * ============================================================================
 * PATRÓN ADAPTER — ADAPTEE (GoF): LinkedInJobApi
 * ============================================================================
 * Representa la interfaz propietaria de la API de empleos de LinkedIn.
 * Expone un formato propio con campos específicos de la red profesional.
 */
export interface LinkedInRawPosting {
    jobId: string;
    jobTitle: string;
    companyName: string;
    formattedLocation: string;
    workplaceType: "On-site" | "Hybrid" | "Remote";
    formattedSalary: string;
    jobDescription: string;
    skillsList: string[];
    seniorityLevel: string;
    listedAt: number;
    applyUrl: string;
}
export declare class LinkedInJobApi {
    getLinkedInPostings(keywords?: string): Promise<LinkedInRawPosting[]>;
}
