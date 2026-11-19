import { ICareerElement, CareerElementType } from "../career-element.interface";
import { ICareerVisitor } from "../career-visitor.interface";

export interface CodeChallengeData {
  id: string;
  challengeTitle: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard";
  testsPassed: number;
  totalTests: number;
  cyclomaticComplexity: number;
  executionTimeMs: number;
  cleanCodeScore: number; // 0 - 100
  passed: boolean;
  timestamp?: string;
  codeSnippet?: string;
}

/**
 * ============================================================================
 * PATRÓN VISITOR: Elemento Concreto 2 (CodeChallengeElement)
 * ============================================================================
 * Representa la solución a un reto de código y algoritmia técnica.
 * Implementa el método `accept` redirigiendo al visitante hacia `visitCodeChallenge(this)`.
 */
export class CodeChallengeElement implements ICareerElement {
  public readonly id: string;
  public readonly elementType: CareerElementType = "code_challenge";
  public readonly timestamp: string;

  public readonly challengeTitle: string;
  public readonly language: string;
  public readonly difficulty: "Easy" | "Medium" | "Hard";
  public readonly testsPassed: number;
  public readonly totalTests: number;
  public readonly cyclomaticComplexity: number;
  public readonly executionTimeMs: number;
  public readonly cleanCodeScore: number;
  public readonly passed: boolean;
  public readonly codeSnippet?: string;

  constructor(data: CodeChallengeData) {
    this.id = data.id;
    this.challengeTitle = data.challengeTitle;
    this.language = data.language;
    this.difficulty = data.difficulty;
    this.testsPassed = Math.max(0, data.testsPassed);
    this.totalTests = Math.max(1, data.totalTests);
    this.cyclomaticComplexity = Math.max(1, data.cyclomaticComplexity);
    this.executionTimeMs = Math.max(0, data.executionTimeMs);
    this.cleanCodeScore = Math.max(0, Math.min(100, data.cleanCodeScore));
    this.passed = data.passed;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.codeSnippet = data.codeSnippet;
  }

  /**
   * Retorna el porcentaje de tests unitarios aprobados
   */
  public get passRatio(): number {
    return Math.round((this.testsPassed / this.totalTests) * 100);
  }

  /**
   * Doble despacho hacia el método especializado del visitante
   */
  public accept(visitor: ICareerVisitor): void {
    visitor.visitCodeChallenge(this);
  }
}
