import { getRandomInterviewCover } from "../config/constants";
import {
  createInterview,
  getInterviewById,
  updateInterview,
} from "./interviews.service";
import { IAIProvider } from "./ai/ai-provider.interface";
import { AIProviderFactory } from "./ai/ai-provider.factory";

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
export class QuestionGeneratorService {
  constructor(private aiProvider: IAIProvider = AIProviderFactory.getProvider()) {}

  /**
   * Crea inmediatamente el registro de la entrevista y desencadena la generación de preguntas en segundo plano.
   * @returns ID de la entrevista creada.
   */
  async createAndInitiateGeneration(input: GenerateQuestionsInput): Promise<string> {
    const formattedTechstack =
      typeof input.techstack === "string"
        ? input.techstack.split(",").map((s) => s.trim())
        : Array.isArray(input.techstack)
        ? input.techstack
        : [];

    // 1. Crear la entrevista en la base de datos como no finalizada
    const interviewId = await createInterview({
      role: input.role,
      type: input.type,
      level: input.level,
      techstack: formattedTechstack,
      questions: [],
      userId: input.userId || "user_unknown",
      finalized: false,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    });

    // 2. Procesar la generación en segundo plano sin bloquear al cliente
    this.generateQuestionsInBackground(interviewId, input, formattedTechstack).catch(
      (err) => {
        console.error(
          `[QuestionGeneratorService] Error no controlado en background para entrevista ${interviewId}:`,
          err?.message || err
        );
      }
    );

    return interviewId;
  }

  private async generateQuestionsInBackground(
    interviewId: string,
    input: GenerateQuestionsInput,
    techstack: string[]
  ): Promise<void> {
    try {
      console.log(`[QuestionGeneratorService] Iniciando generación para entrevista ${interviewId}...`);

      const prompt = `Prepara preguntas para una entrevista de trabajo.
El rol es: ${input.role}.
El nivel de experiencia es: ${input.level}.
El stack tecnológico es: ${techstack.join(", ")}.
El enfoque es: ${input.type}.
La cantidad de preguntas requeridas es: ${input.amount}.
Devuelve ÚNICAMENTE un array JSON con las preguntas, sin texto adicional, sin backticks:
["Pregunta 1", "Pregunta 2", "Pregunta 3"]`;

      const questions = await this.aiProvider.generateJson<string[]>(
        [{ text: prompt }],
        { temperature: 0.7 }
      );

      const interview = await getInterviewById(interviewId);
      if (interview) {
        interview.questions = Array.isArray(questions) ? questions : [];
        interview.finalized = true;
        await updateInterview(interview);
        console.log(
          `[QuestionGeneratorService] Entrevista ${interviewId} generada exitosamente con ${interview.questions.length} preguntas.`
        );
      }
    } catch (bgError: any) {
      console.error(
        `[QuestionGeneratorService] Error generando preguntas para entrevista ${interviewId}:`,
        bgError?.message || bgError
      );
    }
  }
}
