/**
 * cloneable.interface.ts
 * Contrato base para el Patrón Creacional Prototype (GoF).
 * Define la operación de clonación independiente para cualquier entidad del dominio.
 */
export interface ICloneable<T> {
  /**
   * Crea y retorna una copia exacta (clon profundo) de la instancia actual.
   */
  clone(): T;
}
