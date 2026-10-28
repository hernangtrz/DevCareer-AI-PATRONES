"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WellfoundJobApi = void 0;
class WellfoundJobApi {
    async getStartupJobs(role) {
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
                job_url: "https://wellfound.com/jobs/cortex-ai-founding-engineer",
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
                job_url: "https://wellfound.com/jobs/hyperscale-senior-backend",
            },
        ];
    }
}
exports.WellfoundJobApi = WellfoundJobApi;
//# sourceMappingURL=wellfound-job.api.js.map