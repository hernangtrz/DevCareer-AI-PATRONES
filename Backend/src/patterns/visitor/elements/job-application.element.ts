import { ICareerElement, CareerElementType } from "../career-element.interface";
import { ICareerVisitor } from "../career-visitor.interface";

export interface JobApplicationData {
  id: string;
  jobTitle: string;
  company: string;
  status: "applied" | "interviewing" | "offered" | "rejected";
  matchScore: number; // 0 - 100
  seniority: "Junior" | "Mid-Level" | "Senior" | "Lead";
  salaryUSD?: string;
  platform: string;
  notes?: string;
  techStack?: string[];
  timestamp?: string;
}

/**
 * ============================================================================
 * PATRÓN VISITOR: Elemento Concreto 3 (JobApplicationElement)
 * ============================================================================
 * Representa una postulación activa o histórica a un empleo tecnológico.
 * Implementa el método `accept` redirigiendo al visitante hacia `visitJobApplication(this)`.
 */
export class JobApplicationElement implements ICareerElement {
  public readonly id: string;
  public readonly elementType: CareerElementType = "job_application";
  public readonly timestamp: string;

  public readonly jobTitle: string;
  public readonly company: string;
  public readonly status: "applied" | "interviewing" | "offered" | "rejected";
  public readonly matchScore: number;
  public readonly seniority: "Junior" | "Mid-Level" | "Senior" | "Lead";
  public readonly salaryUSD?: string;
  public readonly platform: string;
  public readonly notes?: string;
  public readonly techStack: string[];

  constructor(data: JobApplicationData) {
    this.id = data.id;
    this.jobTitle = data.jobTitle;
    this.company = data.company;
    this.status = data.status;
    this.matchScore = Math.max(0, Math.min(100, data.matchScore));
    this.seniority = data.seniority;
    this.salaryUSD = data.salaryUSD;
    this.platform = data.platform;
    this.notes = data.notes;
    this.techStack = data.techStack ? [...data.techStack] : [];
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  /**
   * Doble despacho hacia el método especializado del visitante
   */
  public accept(visitor: ICareerVisitor): void {
    visitor.visitJobApplication(this);
  }
}
