import { IAIProvider } from "./ai/ai-provider.interface";
import { InterviewBuilder } from "../patterns/builder";
export interface GenerateQuestionsInput {
    role: string;
    level: string;
    techstack: string | string[];
    type: string;
    amount: number | string;
    userId: string;
}
/**
 * Servicio especializado en la generación y orquestación de preguntas para entrevistas (CC-05).
 * Aplica los principios SOLID (SRP / DIP) e integra el Patrón Builder (GoF) a través de InterviewDirector
 * para garantizar la construcción paso a paso validada del objeto Interview antes de su persistencia.
 */
export declare class QuestionGeneratorService {
    private aiProvider;
    private director;
    constructor(aiProvider?: IAIProvider, builder?: InterviewBuilder);
    /**
     * Crea inmediatamente el registro de la entrevista (usando Builder) y desencadena la generación de preguntas en segundo plano.
     * @returns ID de la entrevista creada.
     */
    createAndInitiateGeneration(input: GenerateQuestionsInput): Promise<string>;
    private generateQuestionsInBackground;
}
