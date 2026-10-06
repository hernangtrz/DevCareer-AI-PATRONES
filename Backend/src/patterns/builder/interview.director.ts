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
export class InterviewDirector {
  constructor(private builder: IInterviewBuilder) {}

  /**
   * Cambia el builder asignado al director.
   */
  public setBuilder(builder: IInterviewBuilder): void {
    this.builder = builder;
  }

  /**
   * Construye una entrevista en estado BORRADOR (sin preguntas aún, lista para IA en segundo plano).
   */
  public constructDraftInterview(params: ConstructDraftParams): Omit<Interview, "id"> {
    return this.builder
      .reset()
      .forUser(params.userId)
      .withRole(params.role)
      .withLevel(params.level)
      .ofType(params.type)
      .withTechStack(params.techstack)
      .withQuestions([])
      .assignRandomCover()
      .asDraft()
      .build();
  }

  /**
   * Construye una entrevista técnica completa ya finalizada con su banco de preguntas.
   */
  public constructTechnicalInterview(params: ConstructFullParams): Omit<Interview, "id"> {
    const b = this.builder
      .reset()
      .forUser(params.userId)
      .withRole(params.role)
      .withLevel(params.level)
      .ofType("Technical")
      .withTechStack(params.techstack)
      .withQuestions(params.questions)
      .asFinalized();

    if (params.coverImage) {
      b.withCoverImage(params.coverImage);
    } else {
      b.assignRandomCover();
    }

    return b.build();
  }

  /**
   * Construye una entrevista basada en un Prototipo existente adaptándolo al usuario.
   */
  public constructFromPrototype(userId: string, prototype: InterviewPrototype): Omit<Interview, "id"> {
    const clone = prototype.clone();
    clone.prepareForUser(userId, { finalized: true });

    return this.builder
      .reset()
      .forUser(userId)
      .withRole(clone.role)
      .withLevel(clone.level)
      .ofType(clone.type)
      .withTechStack(clone.techstack)
      .withQuestions(clone.questions)
      .withCoverImage(clone.coverImage)
      .asFinalized()
      .build();
  }
}
