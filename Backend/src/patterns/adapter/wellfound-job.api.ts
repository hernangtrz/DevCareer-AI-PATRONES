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

export class WellfoundJobApi {
  async getStartupJobs(role?: string): Promise<WellfoundRawJob[]> {
    return [
      {
        id: "wf-301",
        role_title: "Founding Full Stack Engineer (Next.js & AI)",
        startup_name: "Cortex AI (YC W25)",
        equity: "0.5% - 1.5%",
        compensation: "$110,000 - $145,000 USD",
        remote_policy: "100% Remote / Anywhere",
        tech_tags: ["Next.js", "React", "TypeScript", "Python", "TailwindCSS", "OpenAI"],
        pitch: "Únete como primer ingeniero en una startup acelerada por Y-Combinator. Construirás agentes de productividad impulsados por modelos multimodales.",
        posted_date: new Date(Date.now() - 3600000 * 6).toISOString(),
        job_url: "https://wellfound.com/jobs?query=Full+Stack+Engineer",
      },
      {
        id: "wf-302",
        role_title: "Senior Backend / DevOps Engineer",
        startup_name: "HyperScale Cloud",
        equity: "0.2% - 0.8%",
        compensation: "$120,000 - $160,000 USD",
        remote_policy: "Remote - Latin America",
        tech_tags: ["AWS", "Docker", "Kubernetes", "Go", "Terraform", "PostgreSQL"],
        pitch: "Plataforma de infraestructura edge para bases de datos distribuidas. Escalabilidad extrema y observabilidad en tiempo real.",
        posted_date: new Date(Date.now() - 3600000 * 30).toISOString(),
        job_url: "https://wellfound.com/jobs?query=Backend+DevOps+Engineer",
      },
    ];
  }
}
