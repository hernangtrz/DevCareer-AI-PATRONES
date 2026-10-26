import { IJobPortalAdapter } from "./job-portal-adapter.interface";
import { JobOffer } from "../../types/job.types";

/**
 * ============================================================================
 * PATRÓN ADAPTER — CONCRETE ADAPTER (GoF): InternalJobPortalAdapter
 * ============================================================================
 * Adapta el catálogo interno de ofertas curadas para entrevistas de DevCareer AI
 * a la interfaz estándar IJobPortalAdapter.
 */
export class InternalJobPortalAdapter implements IJobPortalAdapter {
  readonly portalName = "Internal";

  private internalCatalog: JobOffer[] = [
    {
      id: "int-201",
      title: "Backend Engineer - Cloud Systems",
      company: "Mercado Libre",
      location: "Bogotá, Colombia (Híbrido/Remoto)",
      type: "Full-time",
      salary: "$14.000.000 - $18.000.000 COP",
      currency: "COP",
      description: "Desarrollo de servicios transaccionales de alta concurrencia en Go y Node.js, mensajería con Kafka y almacenamiento DynamoDB.",
      requiredSkills: ["Node.js", "Go", "AWS", "DynamoDB", "Kafka", "Docker"],
      seniority: "Mid-Level",
      platform: "Internal",
      createdAt: new Date().toISOString(),
    },
    {
      id: "int-202",
      title: "Full Stack Engineer (React & TypeScript)",
      company: "Rappi Bank",
      location: "Remoto (Latinoamérica)",
      type: "Full-time",
      salary: "$4,500 - $6,500 USD",
      currency: "USD",
      description: "Construcción de interfaces bancarias con React, TypeScript y microservicios en Express/NestJS.",
      requiredSkills: ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL"],
      seniority: "Senior",
      platform: "Internal",
      createdAt: new Date().toISOString(),
    },
    {
      id: "int-203",
      title: "Junior Software Engineer",
      company: "Globant",
      location: "Remoto (Colombia)",
      type: "Full-time",
      salary: "$6.000.000 - $8.500.000 COP",
      currency: "COP",
      description: "Oportunidad para desarrolladores en crecimiento con buenas bases en programación orientada a objetos, git y APIs REST.",
      requiredSkills: ["JavaScript", "TypeScript", "REST APIs", "Git", "SQL"],
      seniority: "Junior",
      platform: "Internal",
      createdAt: new Date().toISOString(),
    },
  ];

  async fetchJobs(params?: { query?: string; tags?: string[]; limit?: number }): Promise<JobOffer[]> {
    let result = this.internalCatalog;
    if (params?.query) {
      const q = params.query.toLowerCase();
      result = result.filter(
        (j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
      );
    }
    return result.slice(0, params?.limit || 20);
  }

  async getJobDetails(externalId: string): Promise<JobOffer | null> {
    return this.internalCatalog.find((j) => j.id === externalId) || null;
  }
}
