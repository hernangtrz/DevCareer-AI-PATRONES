import { IInterviewBuilder } from "./interview.builder";
import { Interview } from "../../types";
import { InterviewPrototype } from "../prototype/interview.prototype";
export interface ConstructDraftParams {
    userId: string;
    role: string;
    level: string;
    type: string;
    techstack: string[];
}
export interface ConstructFullParams extends ConstructDraftParams {
    questions: string[];
    coverImage?: string;
}
/**
 * Director del Patrón Builder: InterviewDirector
 *
 * Coordina y secuencia los pasos de construcción para producir familias
 * o configuraciones específicas de entrevistas, aislando al cliente del detalle fino
 * del algoritmo de ensamblado.
 */
export declare class InterviewDirector {
    private builder;
    constructor(builder: IInterviewBuilder);
    /**
     * Cambia el builder asignado al director.
     */
    setBuilder(builder: IInterviewBuilder): void;
    /**
     * Construye una entrevista en estado BORRADOR (sin preguntas aún, lista para IA en segundo plano).
     */
    constructDraftInterview(params: ConstructDraftParams): Omit<Interview, "id">;
    /**
     * Construye una entrevista técnica completa ya finalizada con su banco de preguntas.
     */
    constructTechnicalInterview(params: ConstructFullParams): Omit<Interview, "id">;
    /**
     * Construye una entrevista basada en un Prototipo existente adaptándolo al usuario.
     */
    constructFromPrototype(userId: string, prototype: InterviewPrototype): Omit<Interview, "id">;
}
