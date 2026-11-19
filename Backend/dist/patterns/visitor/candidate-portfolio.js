"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatePortfolio = void 0;
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
class CandidatePortfolio {
    constructor(candidateId = "default-candidate") {
        this.candidateId = candidateId;
        this.elements = [];
    }
    /**
     * Agrega un nuevo elemento al portafolio
     */
    addElement(element) {
        this.elements.push(element);
    }
    /**
     * Agrega múltiples elementos en lote
     */
    addElements(elements) {
        this.elements.push(...elements);
    }
    /**
     * Retorna una vista inmutable de los elementos almacenados
     */
    getElements() {
        return this.elements;
    }
    /**
     * Retorna el número total de elementos contenidos en el expediente
     */
    get size() {
        return this.elements.length;
    }
    /**
     * Itera sobre cada elemento heterogéneo y ejecuta el doble despacho `accept(visitor)`.
     * El cliente no requiere conocer las clases concretas de los elementos.
     */
    accept(visitor) {
        for (const element of this.elements) {
            element.accept(visitor);
        }
    }
    /**
     * Limpia todos los elementos del portafolio
     */
    clear() {
        this.elements = [];
    }
}
exports.CandidatePortfolio = CandidatePortfolio;
//# sourceMappingURL=candidate-portfolio.js.map