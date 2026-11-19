import { ICareerElement, CareerElementType } from "../career-element.interface";
import { ICareerVisitor } from "../career-visitor.interface";
export interface CvAtsAnalysisData {
    id: string;
    targetRole: string;
    atsScore: number;
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
export declare class CvAtsAnalysisElement implements ICareerElement {
    readonly id: string;
    readonly elementType: CareerElementType;
    readonly timestamp: string;
    readonly targetRole: string;
    readonly atsScore: number;
    readonly matchedKeywords: string[];
    readonly missingKeywords: string[];
    readonly formattingIssues: string[];
    readonly hasClearSenioritySummary: boolean;
    constructor(data: CvAtsAnalysisData);
    /**
     * Doble despacho hacia el método especializado del visitante
     */
    accept(visitor: ICareerVisitor): void;
}
