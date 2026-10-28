/**
 * ============================================================================
 * PATRÓN ADAPTER — ADAPTEE (GoF): GreenhouseJobApi
 * ============================================================================
 * Representa la interfaz ATS propietaria de Greenhouse Board API.
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
    getBoardJobs(boardToken?: string): Promise<GreenhouseRawJob[]>;
}
