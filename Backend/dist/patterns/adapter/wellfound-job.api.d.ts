/**
 * ============================================================================
 * PATRÓN ADAPTER — ADAPTEE (GoF): WellfoundJobApi
 * ============================================================================
 * Representa la interfaz propietaria de Wellfound (antiguo AngelList Talent)
 * para ofertas de empleo en startups de tecnología de alto impacto.
 */
export interface WellfoundRawJob {
    id: string;
    role_title: string;
    startup_name: string;
    equity: string;
    compensation: string;
    remote_policy: string;
    tech_tags: string[];
    pitch: string;
    posted_date: string;
    job_url: string;
}
export declare class WellfoundJobApi {
    getStartupJobs(role?: string): Promise<WellfoundRawJob[]>;
}
