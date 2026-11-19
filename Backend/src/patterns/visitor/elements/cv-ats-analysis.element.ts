import { ICareerElement, CareerElementType } from "../career-element.interface";
import { ICareerVisitor } from "../career-visitor.interface";

export interface CvAtsAnalysisData {
  id: string;
  targetRole: string;
  atsScore: number; // 0 - 100
  matchedKeywords: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  hasClearSenioritySummary: boolean;
  timestamp?: string;
}

/**
 * ============================================================================
 * PATRÓN VISITOR: Elemento Concreto 4 (CvAtsAnalysisElement)
 * ============================================================================
 * Representa el resultado del análisis de un currículum contra filtros ATS.
 * Implementa el método `accept` redirigiendo al visitante hacia `visitCvAts(this)`.
 */
export class CvAtsAnalysisElement implements ICareerElement {
  public readonly id: string;
  public readonly elementType: CareerElementType = "cv_ats";
  public readonly timestamp: string;

  public readonly targetRole: string;
  public readonly atsScore: number;
  public readonly matchedKeywords: string[];
  public readonly missingKeywords: string[];
  public readonly formattingIssues: string[];
  public readonly hasClearSenioritySummary: boolean;

  constructor(data: CvAtsAnalysisData) {
    this.id = data.id;
    this.targetRole = data.targetRole;
    this.atsScore = Math.max(0, Math.min(100, data.atsScore));
    this.matchedKeywords = [...data.matchedKeywords];
    this.missingKeywords = [...data.missingKeywords];
    this.formattingIssues = [...data.formattingIssues];
    this.hasClearSenioritySummary = data.hasClearSenioritySummary;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  /**
   * Doble despacho hacia el método especializado del visitante
   */
  public accept(visitor: ICareerVisitor): void {
    visitor.visitCvAts(this);
  }
}
