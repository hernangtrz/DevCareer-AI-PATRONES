import {
  createInterview,
  getInterviewById,
  updateInterview,
} from "./interviews.service";
import { IAIProvider } from "./ai/ai-provider.interface";
import { AIProviderFactory } from "./ai/ai-provider.factory";
import { InterviewBuilder, InterviewDirector } from "../patterns/builder";

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
export class QuestionGeneratorService {
  private director: InterviewDirector;

  constructor(
    private aiProvider: IAIProvider = AIProviderFactory.getProvider(),
    builder: InterviewBuilder = new InterviewBuilder()
  ) {
    this.director = new InterviewDirector(builder);
  }

  /**
   * Crea inmediatamente el registro de la entrevista (usando Builder) y desencadena la generación de preguntas en segundo plano.
   * @returns ID de la entrevista creada.
   */
  async createAndInitiateGeneration(input: GenerateQuestionsInput): Promise<string> {
    const formattedTechstack =
      typeof input.techstack === "string"
        ? input.techstack.split(",").map((s) => s.trim())
        : Array.isArray(input.techstack)
        ? input.techstack
        : [];

    // 1. Patrón Builder (Director): Ensambla de forma validada la entrevista en estado Borrador
    const draftInterview = this.director.constructDraftInterview({
      userId: input.userId || "user_unknown",
      role: input.role,
      level: input.level,
      type: input.type,
      techstack: formattedTechstack,
    });

    const interviewId = await createInterview(draftInterview);

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
