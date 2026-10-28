/**
 * ============================================================================
 * PATRÓN ADAPTER — ADAPTEE (GoF): LeverJobApi
 * ============================================================================
 * Representa la interfaz ATS propietaria de Lever Postings API.
 */
export interface LeverRawPosting {
    id: string;
    text: string;
    categories: {
        commitment: string;
        location: string;
        team: string;
    };
    descriptionPlain: string;
    lists: {
        text: string;
        content: string;
    }[];
    hostedUrl: string;
    createdAt: number;
}
export declare class LeverJobApi {
    getPostings(site?: string): Promise<LeverRawPosting[]>;
}
