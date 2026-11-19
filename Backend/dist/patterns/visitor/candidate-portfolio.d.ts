import { ICareerElement } from "./career-element.interface";
import { ICareerVisitor } from "./career-visitor.interface";
/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL VISITOR (GoF): Object Structure (CandidatePortfolio)
 * ============================================================================
 * Mantiene la colección compuesta de elementos heterogéneos que representan
 * el portafolio y expediente integral del candidato (`ICareerElement[]`).
 *
 * Provee la interfaz para agregar elementos y ejecutar la iteración que
 * desencadena el Doble Despacho sobre cada elemento con el visitante recibido.
 */
export declare class CandidatePortfolio {
    readonly candidateId: string;
    private elements;
    constructor(candidateId?: string);
    /**
     * Agrega un nuevo elemento al portafolio
     */
    addElement(element: ICareerElement): void;
    /**
     * Agrega múltiples elementos en lote
     */
    addElements(elements: ICareerElement[]): void;
    /**
     * Retorna una vista inmutable de los elementos almacenados
     */
    getElements(): ReadonlyArray<ICareerElement>;
    /**
     * Retorna el número total de elementos contenidos en el expediente
     */
    get size(): number;
    /**
     * Itera sobre cada elemento heterogéneo y ejecuta el doble despacho `accept(visitor)`.
     * El cliente no requiere conocer las clases concretas de los elementos.
     */
    accept(visitor: ICareerVisitor): void;
    /**
     * Limpia todos los elementos del portafolio
     */
    clear(): void;
}
