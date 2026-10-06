import { IInterviewRepository } from "../repositories/interview.repository";
import { Interview } from "../types";
export declare function setInterviewRepository(repo: IInterviewRepository): void;
export declare function getInterviewsByUserId(userId: string): Promise<Interview[]>;
export declare function getLatestInterviews(userId: string, limit?: number): Promise<Interview[]>;
export declare function getInterviewById(id: string): Promise<Interview | null>;
export declare function createInterview(interview: Omit<Interview, "id">): Promise<string>;
export declare function updateInterview(interview: Interview): Promise<void>;
/**
 * Patrón Prototype: Crea una nueva entrevista a partir de una plantilla registrada
 * utilizando clonación profunda (Deep Clone).
 */
export declare function createInterviewFromTemplate(templateId: string, userId: string): Promise<string | null>;
/**
 * Patrón Prototype: Clona una entrevista histórica existente para permitir reintentarla
 * o duplicarla sin afectar la entrevista original.
 */
export declare function cloneInterview(interviewId: string, userId: string): Promise<string | null>;
