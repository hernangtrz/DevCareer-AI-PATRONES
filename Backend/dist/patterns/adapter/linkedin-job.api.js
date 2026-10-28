"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInJobApi = void 0;
class LinkedInJobApi {
    async getLinkedInPostings(keywords) {
        const raw = [
            {
                jobId: "li-8001",
                jobTitle: "Senior Frontend Engineer (React & Next.js)",
                companyName: "Microsoft",
                formattedLocation: "Redmond, WA (Remoto)",
                workplaceType: "Remote",
                formattedSalary: "$150,000 - $185,000 USD/año",
                jobDescription: "Liderar el desarrollo de experiencias de usuario en la nube con React 19, TypeScript y Next.js. Colaboración con equipos de accesibilidad y diseño.",
                skillsList: ["React", "TypeScript", "Next.js", "GraphQL", "Jest", "CSS Modules"],
                seniorityLevel: "Senior",
                listedAt: Date.now() - 3600000 * 5,
                applyUrl: "https://www.linkedin.com/jobs/view/senior-frontend-microsoft",
            },
            {
                jobId: "li-8002",
                jobTitle: "Cloud Solutions Architect - AWS",
                companyName: "Amazon Web Services",
                formattedLocation: "Bogotá, Colombia (Híbrido)",
                workplaceType: "Hybrid",
                formattedSalary: "$20.000.000 - $26.000.000 COP/mes",
                jobDescription: "Diseñar arquitecturas distribuidas, escalables y seguras en AWS. Soporte técnico de alto nivel para clientes enterprise en migración a la nube.",
                skillsList: ["AWS", "Terraform", "Kubernetes", "Node.js", "Python", "Microservicios"],
                seniorityLevel: "Lead",
                listedAt: Date.now() - 3600000 * 12,
                applyUrl: "https://www.linkedin.com/jobs/view/solutions-architect-aws",
            },
            {
                jobId: "li-8003",
                jobTitle: "Mid-Level Backend Developer (Node.js & Go)",
                companyName: "Uber",
                formattedLocation: "Remoto (Latinoamérica)",
                workplaceType: "Remote",
                formattedSalary: "$5,000 - $7,000 USD/mes",
                jobDescription: "Construcción de microservicios de baja latencia para la plataforma de movilidad y logística utilizando Node.js, Go y Apache Kafka.",
                skillsList: ["Node.js", "Go", "Kafka", "PostgreSQL", "Docker", "Redis"],
                seniorityLevel: "Mid-Level",
                listedAt: Date.now() - 3600000 * 24,
                applyUrl: "https://www.linkedin.com/jobs/view/backend-developer-uber",
            },
        ];
        if (keywords) {
            const q = keywords.toLowerCase();
            return raw.filter(j => j.jobTitle.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q));
        }
        return raw;
    }
}
exports.LinkedInJobApi = LinkedInJobApi;
//# sourceMappingURL=linkedin-job.api.js.map