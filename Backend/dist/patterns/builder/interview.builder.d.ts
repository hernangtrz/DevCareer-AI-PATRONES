import { Interview } from "../../types";
/**
 * Interfaz formal para constructores de entrevistas (GoF Builder).
 */
export interface IInterviewBuilder {
    reset(): this;
    forUser(userId: string): this;
    withRole(role: string): this;
    withLevel(level: string): this;
    ofType(type: string): this;
    withTechStack(techstack: string[]): this;
    addTech(tech: string): this;
    withQuestions(questions: string[]): this;
    addQuestion(question: string): this;
    withCoverImage(coverImage?: string): this;
    assignRandomCover(): this;
    asDraft(): this;
    asFinalized(): this;
    build(): Omit<Interview, "id">;
}
/**
 * Constructor Concreto: InterviewBuilder
 *
 * Implementa el Patrón Builder (GoF). Permite ensamblar objetos complejos de tipo `Interview`
 * de forma paso a paso con una API fluida (Fluent Interface).
 *
 * Encapsula las reglas de integridad del dominio:
 * - Valida que existan los campos obligatorios (userId, role, level, type).
 * - Sanitiza y aisla listas de tecnologías y preguntas.
 * - Asegura asignación de imagen de portada por defecto si no se especifica.
 * - Garantiza timestamps estandarizados en formato ISO.
 */
export declare class InterviewBuilder implements IInterviewBuilder {
    private userId;
    private role;
    private level;
    private type;
    private techstack;
    private questions;
    private coverImage?;
    private finalized;
    private createdAt;
    constructor();
    reset(): this;
    forUser(userId: string): this;
    withRole(role: string): this;
    withLevel(level: string): this;
    ofType(type: string): this;
    withTechStack(techstack: string[]): this;
    addTech(tech: string): this;
    withQuestions(questions: string[]): this;
    addQuestion(question: string): this;
    withCoverImage(coverImage?: string): this;
    assignRandomCover(): this;
    asDraft(): this;
    asFinalized(): this;
    /**
     * Finaliza el ensamble y valida que todos los invariantes del objeto sean correctos.
     * Lanza un error descriptivo si falta algún requerimiento esencial.
     */
    build(): Omit<Interview, "id">;
}
