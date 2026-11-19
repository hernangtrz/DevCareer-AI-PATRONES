import { ICareerElement, CareerElementType } from "../career-element.interface";
import { ICareerVisitor } from "../career-visitor.interface";

export interface InterviewSessionData {
  id: string;
  role: string;
  company: string;
  technicalScore: number; // 0 - 100
  communicationScore: number; // 0 - 100
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  techStack: string[];
  finalized: boolean;
  timestamp?: string;
  feedbackSummary?: string;
}

/**
 * ============================================================================
 * PATRÓN VISITOR: Elemento Concreto 1 (InterviewSessionElement)
 * ============================================================================
 * Representa una sesión de entrevista técnica o comportamental simulada.
 * Implementa el método `accept` redirigiendo al visitante hacia `visitInterview(this)`.
 */
export class InterviewSessionElement implements ICareerElement {
  public readonly id: string;
  public readonly elementType: CareerElementType = "interview";
  public readonly timestamp: string;

  public readonly role: string;
  public readonly company: string;
  public readonly technicalScore: number;
  public readonly communicationScore: number;
  public readonly cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  public readonly techStack: string[];
  public readonly finalized: boolean;
  public readonly feedbackSummary?: string;

  constructor(data: InterviewSessionData) {
    this.id = data.id;
    this.role = data.role;
    this.company = data.company;
    this.technicalScore = Math.max(0, Math.min(100, data.technicalScore));
    this.communicationScore = Math.max(0, Math.min(100, data.communicationScore));
    this.cefrLevel = data.cefrLevel;
    this.techStack = [...data.techStack];
    this.finalized = data.finalized;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.feedbackSummary = data.feedbackSummary;
  }

  /**
   * Doble despacho hacia el método especializado del visitante
   */
  public accept(visitor: ICareerVisitor): void {
    visitor.visitInterview(this);
  }
}
