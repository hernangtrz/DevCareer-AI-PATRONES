/**
 * ============================================================================
 * PATRÓN ADAPTER — ADAPTEE (GoF): LeverJobApi
 * ============================================================================
 * Consulta en tiempo real las vacantes técnicas oficiales del Board público de Lever
 * (por ejemplo Palantir Technologies) con enlaces activos a su portal de postulación.
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
    /**
     * Consulta vacantes reales en vivo desde el API público de Lever
     */
    getPostings(site?: string): Promise<LeverRawPosting[]>;
    private getFallbackPostings;
}
