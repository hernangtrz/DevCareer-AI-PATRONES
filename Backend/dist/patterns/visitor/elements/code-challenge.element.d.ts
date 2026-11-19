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
    cleanCodeScore: number;
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
export declare class CodeChallengeElement implements ICareerElement {
    readonly id: string;
    readonly elementType: CareerElementType;
    readonly timestamp: string;
    readonly challengeTitle: string;
    readonly language: string;
    readonly difficulty: "Easy" | "Medium" | "Hard";
    readonly testsPassed: number;
    readonly totalTests: number;
    readonly cyclomaticComplexity: number;
    readonly executionTimeMs: number;
    readonly cleanCodeScore: number;
    readonly passed: boolean;
    readonly codeSnippet?: string;
    constructor(data: CodeChallengeData);
    /**
     * Retorna el porcentaje de tests unitarios aprobados
     */
    get passRatio(): number;
    /**
     * Doble despacho hacia el método especializado del visitante
     */
    accept(visitor: ICareerVisitor): void;
}
