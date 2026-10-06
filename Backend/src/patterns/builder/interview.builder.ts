import { Interview } from "../../types";
import { getRandomInterviewCover } from "../../config/constants";

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
export class InterviewBuilder implements IInterviewBuilder {
  private userId: string = "";
  private role: string = "";
  private level: string = "";
  private type: string = "";
  private techstack: string[] = [];
  private questions: string[] = [];
  private coverImage?: string;
  private finalized: boolean = false;
  private createdAt: string = new Date().toISOString();

  constructor() {
    this.reset();
  }

  public reset(): this {
    this.userId = "";
    this.role = "";
    this.level = "";
    this.type = "";
    this.techstack = [];
    this.questions = [];
    this.coverImage = undefined;
    this.finalized = false;
    this.createdAt = new Date().toISOString();
    return this;
  }

  public forUser(userId: string): this {
    this.userId = userId ? userId.trim() : "";
    return this;
  }

  public withRole(role: string): this {
    this.role = role ? role.trim() : "";
    return this;
  }

  public withLevel(level: string): this {
    this.level = level ? level.trim() : "";
    return this;
  }

  public ofType(type: string): this {
    this.type = type ? type.trim() : "";
    return this;
  }

  public withTechStack(techstack: string[]): this {
    if (Array.isArray(techstack)) {
      this.techstack = techstack
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t.length > 0);
    } else {
      this.techstack = [];
    }
    return this;
  }

  public addTech(tech: string): this {
    if (tech && typeof tech === "string" && tech.trim()) {
      const sanitized = tech.trim();
      if (!this.techstack.includes(sanitized)) {
        this.techstack.push(sanitized);
      }
    }
    return this;
  }

  public withQuestions(questions: string[]): this {
    if (Array.isArray(questions)) {
      this.questions = questions
        .map((q) => (typeof q === "string" ? q.trim() : ""))
        .filter((q) => q.length > 0);
    } else {
      this.questions = [];
    }
    return this;
  }

  public addQuestion(question: string): this {
    if (question && typeof question === "string" && question.trim()) {
      this.questions.push(question.trim());
    }
    return this;
  }

  public withCoverImage(coverImage?: string): this {
    this.coverImage = coverImage && coverImage.trim() ? coverImage.trim() : undefined;
    return this;
  }

  public assignRandomCover(): this {
    this.coverImage = getRandomInterviewCover();
    return this;
  }

  public asDraft(): this {
    this.finalized = false;
    return this;
  }

  public asFinalized(): this {
    this.finalized = true;
    return this;
  }

  /**
   * Finaliza el ensamble y valida que todos los invariantes del objeto sean correctos.
   * Lanza un error descriptivo si falta algún requerimiento esencial.
   */
  public build(): Omit<Interview, "id"> {
    if (!this.userId) {
      throw new Error("InterviewBuilder: 'userId' es requerido para construir la entrevista.");
    }
    if (!this.role) {
      throw new Error("InterviewBuilder: 'role' es requerido para construir la entrevista.");
    }
    if (!this.level) {
      throw new Error("InterviewBuilder: 'level' (seniority) es requerido.");
    }
    if (!this.type) {
      throw new Error("InterviewBuilder: 'type' (enfoque de entrevista) es requerido.");
    }

    const builtEntity: Omit<Interview, "id"> = {
      userId: this.userId,
      role: this.role,
      level: this.level,
      type: this.type,
      techstack: [...this.techstack],
      questions: [...this.questions],
      coverImage: this.coverImage || getRandomInterviewCover(),
      finalized: this.finalized,
      createdAt: this.createdAt || new Date().toISOString(),
    };

    return builtEntity;
  }
}
