import { ICloneable } from "./cloneable.interface";
import { Interview } from "../../types";
export interface InterviewPrototypeData {
    role: string;
    level: string;
    type: string;
    techstack: string[];
    questions: string[];
    coverImage?: string;
    userId?: string;
    finalized?: boolean;
    createdAt?: string;
}
/**
 * Entidad Concreta Prototype: InterviewPrototype
 *
 * Implementa el Patrón Prototype (GoF). Permite crear copias profundas (Deep Copy)
 * de estructuras de entrevistas preconfiguradas o existentes en el historial,
 * garantizando que las modificaciones sobre las listas anidadas (preguntas, techstack)
 * no contaminen el arquetipo original ni a otros clones en memoria.
 */
export declare class InterviewPrototype implements ICloneable<InterviewPrototype> {
    role: string;
    level: string;
    type: string;
    techstack: string[];
    questions: string[];
    coverImage?: string;
    userId: string;
    finalized: boolean;
    createdAt: string;
    constructor(data: InterviewPrototypeData);
    /**
     * Realiza un Deep Clone de la entrevista.
     * Duplica los arrays primitivos para evitar que mutaciones de elementos
     * compartan la misma referencia en memoria.
     */
    clone(): InterviewPrototype;
    /**
     * Ajusta el clon para un usuario específico y resetea metadatos de sesión.
     * Ideal para cuando se toma un arquetipo/plantilla y se asigna al usuario que inicia sesión.
     */
    prepareForUser(newUserId: string, options?: {
        finalized?: boolean;
    }): this;
    /**
     * Permite agregar preguntas adicionales al clon sin afectar el prototipo base.
     */
    addQuestion(question: string): this;
    /**
     * Exporta la información del prototipo al formato DTO requerido por la capa de persistencia.
     */
    toEntity(): Omit<Interview, "id">;
    /**
     * Método de fábrica para instanciar un Prototype desde un objeto Interview de la base de datos.
     */
    static fromEntity(interview: Interview | Omit<Interview, "id">): InterviewPrototype;
}
