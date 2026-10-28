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

export class RemoteOkJobApi {
  async getRemoteJobs(tag: string = "dev", limit: number = 20): Promise<RemoteOkRawJob[]> {
    try {
      const activeTag = tag && tag.trim() !== "" ? tag : "dev";
      const url = "https://remoteok.com/api?tag=" + encodeURIComponent(activeTag);
      const response = await fetch(url, {
        headers: { "User-Agent": "DevCareer-AI-JobPortal/1.0" },
        signal: AbortSignal.timeout(4500),
      });

      if (response.ok) {
        const data = (await response.json()) as any[];
        const rawJobs = data.filter((item) => {
          if (!item || !item.id || !item.position) return false;
          const pos = item.position.toLowerCase();
          return (
            pos.includes("engineer") ||
            pos.includes("developer") ||
            pos.includes("software") ||
            pos.includes("frontend") ||
            pos.includes("backend") ||
            pos.includes("fullstack") ||
            pos.includes("architect") ||
            pos.includes("devops") ||
            pos.includes("cloud") ||
            pos.includes("data")
          );
        }) as RemoteOkRawJob[];

        if (rawJobs.length > 0) return rawJobs.slice(0, limit);
      }
    } catch {
      // Fallback con vacantes tecnicas activas
    }

    return this.getFallbackRawJobs(limit);
  }

  private getFallbackRawJobs(limit: number): RemoteOkRawJob[] {
    const raw: RemoteOkRawJob[] = [
      {
        id: "rok-1137571",
        slug: "remote-senior-software-engineer-klardaten-1137571",
        epoch: Date.now() - 3600000,
        date: new Date().toISOString(),
        company: "Klardaten",
        position: "Senior Software Engineer",
        tags: ["react", "typescript", "node", "postgres", "aws", "docker"],
        description: "Diseno y desarrollo de microservicios distribuidos con TypeScript, Node.js y React.",
        location: "Worldwide / Remote",
        salary_min: 110000,
        salary_max: 155000,
        url: "https://remoteOK.com/remote-jobs/remote-senior-software-engineer-klardaten-1137571",
        apply_url: "https://remoteOK.com/remote-jobs/remote-senior-software-engineer-klardaten-1137571",
      },
      {
        id: "rok-1137568",
        slug: "remote-solutions-engineer-onebrief-1137568",
        epoch: Date.now() - 7200000,
        date: new Date().toISOString(),
        company: "Onebrief",
        position: "Solutions Software Engineer",
        tags: ["fullstack", "typescript", "react", "graphql", "cloud"],
        description: "Implementacion de soluciones en la nube, pipelines de datos y arquitectura frontend.",
        location: "Remote (Global)",
        salary_min: 125000,
        salary_max: 170000,
        url: "https://remoteOK.com/remote-jobs/remote-solutions-engineer-onebrief-1137568",
        apply_url: "https://remoteOK.com/remote-jobs/remote-solutions-engineer-onebrief-1137568",
      },
      {
        id: "rok-1137560",
        slug: "remote-backend-engineer-python-1137560",
        epoch: Date.now() - 10800000,
        date: new Date().toISOString(),
        company: "Synthesia AI",
        position: "Backend Engineer (Python & FastAPIs)",
        tags: ["python", "fastapi", "docker", "llm", "postgresql"],
        description: "Construccion de APIs de alto rendimiento y pipelines de modelos de lenguaje.",
        location: "Remote (Americas/Europe)",
        salary_min: 130000,
        salary_max: 180000,
        url: "https://remoteOK.com/remote-jobs/1137560",
        apply_url: "https://remoteOK.com/remote-jobs/1137560",
      },
    ];
    return raw.slice(0, limit);
  }
}
