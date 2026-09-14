import { IAIProvider } from "./ai/ai-provider.interface";
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
 * Aplica el patrón Service Layer / Facade (SRP / DIP), aislando la creación en base de datos,
 * la interacción con el proveedor de IA y el ciclo asíncrono en segundo plano.
 */
export declare class QuestionGeneratorService {
    private aiProvider;
    constructor(aiProvider?: IAIProvider);
    /**
     * Crea inmediatamente el registro de la entrevista y desencadena la generación de preguntas en segundo plano.
     * @returns ID de la entrevista creada.
     */
    createAndInitiateGeneration(input: GenerateQuestionsInput): Promise<string>;
    private generateQuestionsInBackground;
}
