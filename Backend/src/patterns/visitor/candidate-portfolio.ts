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
export class CandidatePortfolio {
  private elements: ICareerElement[] = [];

  constructor(public readonly candidateId: string = "default-candidate") {}

  /**
   * Agrega un nuevo elemento al portafolio
   */
  public addElement(element: ICareerElement): void {
    this.elements.push(element);
  }

  /**
   * Agrega múltiples elementos en lote
   */
  public addElements(elements: ICareerElement[]): void {
    this.elements.push(...elements);
  }

  /**
   * Retorna una vista inmutable de los elementos almacenados
   */
  public getElements(): ReadonlyArray<ICareerElement> {
    return this.elements;
  }

  /**
   * Retorna el número total de elementos contenidos en el expediente
   */
  public get size(): number {
    return this.elements.length;
  }

  /**
   * Itera sobre cada elemento heterogéneo y ejecuta el doble despacho `accept(visitor)`.
   * El cliente no requiere conocer las clases concretas de los elementos.
   */
  public accept(visitor: ICareerVisitor): void {
    for (const element of this.elements) {
      element.accept(visitor);
    }
  }

  /**
   * Limpia todos los elementos del portafolio
   */
  public clear(): void {
    this.elements = [];
  }
}
