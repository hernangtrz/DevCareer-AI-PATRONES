/**
 * ============================================================================
 * PATRÓN ADAPTER — ADAPTEE (GoF): GreenhouseJobApi
 * ============================================================================
 * Consulta en tiempo real las vacantes técnicas oficiales del Board público de Greenhouse
 * (por ejemplo GitLab / Canonical) sin requerir API keys privadas.
 */
export interface GreenhouseRawJob {
    id: number;
    title: string;
    company_name: string;
    location: {
        name: string;
    };
    content: string;
    departments: {
        name: string;
    }[];
    updated_at: string;
    absolute_url: string;
    metadata: {
        name: string;
        value: string;
    }[];
}
export declare class GreenhouseJobApi {
    /**
     * Consulta vacantes reales en vivo desde el Board público de Greenhouse
     */
    getBoardJobs(boardToken?: string): Promise<GreenhouseRawJob[]>;
    private getFallbackRawJobs;
}
