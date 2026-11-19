import { ICareerElement, CareerElementType } from "../career-element.interface";
import { ICareerVisitor } from "../career-visitor.interface";
export interface InterviewSessionData {
    id: string;
    role: string;
    company: string;
    technicalScore: number;
    communicationScore: number;
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
export declare class InterviewSessionElement implements ICareerElement {
    readonly id: string;
    readonly elementType: CareerElementType;
    readonly timestamp: string;
    readonly role: string;
    readonly company: string;
    readonly technicalScore: number;
    readonly communicationScore: number;
    readonly cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    readonly techStack: string[];
    readonly finalized: boolean;
    readonly feedbackSummary?: string;
    constructor(data: InterviewSessionData);
    /**
     * Doble despacho hacia el método especializado del visitante
     */
    accept(visitor: ICareerVisitor): void;
}
