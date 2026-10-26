"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteOkJobApi = void 0;
class RemoteOkJobApi {
    /**
     * Obtiene empleos desde el feed público de RemoteOK con fallback seguro en memoria
     * para entornos sin conexión o rate-limits.
     */
    async getRemoteJobs(tag, limit = 20) {
        try {
            const url = tag ? `https://remoteok.com/api?tag=${encodeURIComponent(tag)}` : "https://remoteok.com/api";
            const response = await fetch(url, {
                headers: { "User-Agent": "DevCareer-AI-Student-App/1.0" },
                signal: AbortSignal.timeout(4000),
            });
            if (response.ok) {
                const data = (await response.json());
                // El primer elemento de RemoteOK suele ser un objeto legal/metadata
                const rawJobs = data.filter((item) => item && item.id && item.position);
                if (rawJobs.length > 0)
                    return rawJobs.slice(0, limit);
            }
        }
        catch {
            // Fallback local robusto ante rate-limits o sin conexión
        }
        return this.getFallbackRawJobs(limit);
    }
    getFallbackRawJobs(limit) {
        const raw = [
            {
                id: "rok-101",
                slug: "senior-full-stack-typescript-engineer",
                epoch: Date.now() - 3600000,
                date: new Date().toISOString(),
                company: "Stripe",
                position: "Senior Full-Stack TypeScript Engineer",
                tags: ["react", "typescript", "node", "postgres", "aws", "docker"],
                description: "Buscamos un Ingeniero Full-Stack Senior con sólido dominio de TypeScript, React 19, Node.js y arquitectura en la nube para liderar nuestra plataforma de pagos.",
                location: "Worldwide / Remote",
                salary_min: 120000,
                salary_max: 160000,
                url: "https://remoteok.com/remote-jobs/stripe-senior-fullstack",
            },
            {
                id: "rok-102",
                slug: "frontend-architect-nextjs",
                epoch: Date.now() - 7200000,
                date: new Date().toISOString(),
                company: "Vercel",
                position: "Frontend Architect & Next.js Core",
                tags: ["react", "nextjs", "typescript", "tailwind", "performance"],
                description: "Únete al equipo que construye el futuro de la web moderna con Next.js, Server Components y optimización de rendimiento en el Edge.",
                location: "Remote (Americas/Europe)",
                salary_min: 130000,
                salary_max: 180000,
                url: "https://remoteok.com/remote-jobs/vercel-frontend-architect",
            },
            {
                id: "rok-103",
                slug: "ai-backend-engineer-python",
                epoch: Date.now() - 10800000,
                date: new Date().toISOString(),
                company: "Anthropic",
                position: "AI Systems Backend Engineer",
                tags: ["python", "fastapi", "docker", "llm", "postgresql", "kubernetes"],
                description: "Desarrollo de microservicios de inferencia y orquestación para modelos de lenguaje avanzados. Enfoque en escalabilidad y baja latencia.",
                location: "Remote (Global)",
                salary_min: 140000,
                salary_max: 195000,
                url: "https://remoteok.com/remote-jobs/anthropic-ai-engineer",
            },
            {
                id: "rok-104",
                slug: "cloud-devops-platform-engineer",
                epoch: Date.now() - 14400000,
                date: new Date().toISOString(),
                company: "Datadog",
                position: "Cloud DevOps & Platform Engineer",
                tags: ["aws", "terraform", "kubernetes", "docker", "ci/cd", "linux"],
                description: "Automatización de infraestructura como código (IaC), observabilidad y pipelines CI/CD distribuidos para alta disponibilidad.",
                location: "Remote (Americas)",
                salary_min: 110000,
                salary_max: 150000,
                url: "https://remoteok.com/remote-jobs/datadog-platform-engineer",
            },
        ];
        return raw.slice(0, limit);
    }
}
exports.RemoteOkJobApi = RemoteOkJobApi;
//# sourceMappingURL=remote-ok-job.api.js.map