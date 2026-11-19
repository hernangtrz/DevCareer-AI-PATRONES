import { ICareerElement, CareerElementType } from "../career-element.interface";
import { ICareerVisitor } from "../career-visitor.interface";
export interface JobApplicationData {
    id: string;
    jobTitle: string;
    company: string;
    status: "applied" | "interviewing" | "offered" | "rejected";
    matchScore: number;
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
export declare class JobApplicationElement implements ICareerElement {
    readonly id: string;
    readonly elementType: CareerElementType;
    readonly timestamp: string;
    readonly jobTitle: string;
    readonly company: string;
    readonly status: "applied" | "interviewing" | "offered" | "rejected";
    readonly matchScore: number;
    readonly seniority: "Junior" | "Mid-Level" | "Senior" | "Lead";
    readonly salaryUSD?: string;
    readonly platform: string;
    readonly notes?: string;
    readonly techStack: string[];
    constructor(data: JobApplicationData);
    /**
     * Doble despacho hacia el método especializado del visitante
     */
    accept(visitor: ICareerVisitor): void;
}
