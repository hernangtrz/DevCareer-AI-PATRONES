import { ICareerVisitor } from "./career-visitor.interface";
export type CareerElementType = "interview" | "code_challenge" | "job_application" | "cv_ats";
/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL VISITOR (GoF): Elemento Base (Element Interface)
 * ============================================================================
 * Declara el método `accept` que toma una interfaz de visitante como argumento.
 * Gracias a este método, cada elemento concreto invoca el método correspondiente
 * en el visitante (`visitor.visitX(this)`), ejecutando el mecanismo de
 * Doble Despacho (Double Dispatch).
 */
export interface ICareerElement {
    readonly id: string;
    readonly elementType: CareerElementType;
    readonly timestamp: string;
    /**
     * Método de Doble Despacho que permite al visitante operar sobre este elemento concreto
     */
    accept(visitor: ICareerVisitor): void;
}
