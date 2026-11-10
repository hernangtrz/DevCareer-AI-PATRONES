/**
 * ============================================================================
 * PATRON ADAPTER - ADAPTEE (GoF): RemoteOkJobApi
 * ============================================================================
 * Consulta ofertas remotas exclusivamente de tecnologia e ingenieria de software.
 */
export interface RemoteOkRawJob {
    id: string;
    slug: string;
    epoch: number;
    date: string;
    company: string;
    company_logo?: string;
    position: string;
    tags: string[];
    description: string;
    location: string;
    salary_min?: number;
    salary_max?: number;
    apply_url?: string;
    url: string;
}
export declare class RemoteOkJobApi {
    getRemoteJobs(tag?: string, limit?: number): Promise<RemoteOkRawJob[]>;
    private getFallbackRawJobs;
}
