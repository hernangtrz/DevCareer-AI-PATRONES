"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreenhouseJobApi = void 0;
class GreenhouseJobApi {
    async getBoardJobs(boardToken = "tech-startups") {
        return [
            {
                id: 70101,
                title: "Senior Full Stack Engineer (React & Python)",
                company_name: "Deel",
                location: { name: "Remote - Latin America" },
                content: "Buscamos un Ingeniero Full Stack para escalar nuestra plataforma global de pagos y contratos con React 19, TypeScript y microservicios en Python/FastAPI.",
                departments: [{ name: "Engineering / Core Fintech" }],
                updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                absolute_url: "https://boards.greenhouse.io/deel/jobs/70101",
                metadata: [
                    { name: "Salary Range", value: "$6,000 - $8,500 USD / month" },
                    { name: "Required Tech", value: "React, TypeScript, Python, FastAPI, PostgreSQL, Docker" },
                ],
            },
            {
                id: 70102,
                title: "Staff Software Engineer (Platform & Infra)",
                company_name: "Ramp",
                location: { name: "Remote (US / LatAm)" },
                content: "Liderazgo técnico en la infraestructura de pagos corporativos. Enfoque en resiliencia, Kubernetes y arquitecturas serverless de alta disponibilidad.",
                departments: [{ name: "Infrastructure & Platform" }],
                updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
                absolute_url: "https://boards.greenhouse.io/ramp/jobs/70102",
                metadata: [
                    { name: "Salary Range", value: "$160,000 - $210,000 USD / year" },
                    { name: "Required Tech", value: "AWS, Kubernetes, Terraform, Go, Node.js, Kafka" },
                ],
            },
        ];
    }
}
exports.GreenhouseJobApi = GreenhouseJobApi;
//# sourceMappingURL=greenhouse-job.api.js.map