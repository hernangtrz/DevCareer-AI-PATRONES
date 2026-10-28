"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeverJobApi = void 0;
class LeverJobApi {
    async getPostings(site = "fintech") {
        return [
            {
                id: "lev-501",
                text: "Staff Software Engineer (UI Platform)",
                categories: {
                    commitment: "Full-time",
                    location: "Remote (Americas)",
                    team: "Frontend Architecture",
                },
                descriptionPlain: "Diseñar la nueva generación del sistema de diseño y micro-frontends de la plataforma. Foco en Web Vitals, SSR y TypeScript modular.",
                lists: [
                    { text: "Requisitos", content: "React, Next.js, TypeScript, TailwindCSS, Microfrontends, Jest, CI/CD" },
                ],
                hostedUrl: "https://jobs.lever.co/fintech/lev-501",
                createdAt: Date.now() - 3600000 * 3,
            },
            {
                id: "lev-502",
                text: "Senior Backend Engineer (Distributed Systems)",
                categories: {
                    commitment: "Full-time",
                    location: "Remote (Global)",
                    team: "Core Ledger",
                },
                descriptionPlain: "Arquitectura y mantenimiento de motores transaccionales de alta concurrencia en Go y Rust con PostgreSQL particionado.",
                lists: [
                    { text: "Requisitos", content: "Go, Rust, PostgreSQL, Redis, gRPC, Docker, AWS" },
                ],
                hostedUrl: "https://jobs.lever.co/fintech/lev-502",
                createdAt: Date.now() - 3600000 * 18,
            },
        ];
    }
}
exports.LeverJobApi = LeverJobApi;
//# sourceMappingURL=lever-job.api.js.map