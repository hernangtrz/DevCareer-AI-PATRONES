import { InterviewPrototype } from "./interview.prototype";
import { interviewTemplates, getRandomInterviewCover } from "../../config/constants";

/**
 * Catálogo / Registro de Prototipos de Entrevistas
 * 
 * Centraliza los arquetipos de entrevistas predefinidas del sistema y
 * permite a los clientes solicitar copias independientes a través de `clone()`.
 * Previene la instanciación acoplada y manual campo por campo.
 */
export class InterviewPrototypeRegistry {
  private static instance: InterviewPrototypeRegistry;
  private prototypes: Map<string, InterviewPrototype> = new Map();

  private constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Obtiene la instancia única (Singleton) del registro de prototipos.
   */
  public static getInstance(): InterviewPrototypeRegistry {
    if (!InterviewPrototypeRegistry.instance) {
      InterviewPrototypeRegistry.instance = new InterviewPrototypeRegistry();
    }
    return InterviewPrototypeRegistry.instance;
  }

  /**
   * Carga inicial de arquetipos estándar basados en las constantes del sistema.
   */
  private loadDefaultTemplates(): void {
    for (const template of interviewTemplates) {
      const prototype = new InterviewPrototype({
        role: template.role,
        level: template.level,
        type: template.type,
        techstack: template.techstack,
        questions: template.questions,
        coverImage: getRandomInterviewCover(),
        finalized: true,
      });

      this.register(template.id, prototype);
    }
  }

  /**
   * Registra un nuevo prototipo en el catálogo.
   */
  public register(key: string, prototype: InterviewPrototype): void {
    if (!key || !prototype) {
      throw new Error("Clave y prototipo son requeridos para el registro.");
    }
    this.prototypes.set(key, prototype);
  }

  /**
   * Obtiene la referencia directa del prototipo (solo lectura/consulta).
   */
  public get(key: string): InterviewPrototype | null {
    return this.prototypes.get(key) || null;
  }

  /**
   * Retorna una COPIA INDEPENDIENTE (clon) del prototipo solicitado.
   * Modificaciones al objeto devuelto no afectarán al prototipo registrado.
   */
  public clone(key: string): InterviewPrototype | null {
    const prototype = this.prototypes.get(key);
    if (!prototype) {
      return null;
    }
    return prototype.clone();
  }

  /**
   * Comprueba si existe un prototipo bajo la clave especificada.
   */
  public has(key: string): boolean {
    return this.prototypes.has(key);
  }

  /**
   * Lista todas las claves de prototipos registradas.
   */
  public listKeys(): string[] {
    return Array.from(this.prototypes.keys());
  }

  /**
   * Permite reiniciar el catálogo a su estado base (útil para pruebas unitarias).
   */
  public resetToDefaults(): void {
    this.prototypes.clear();
    this.loadDefaultTemplates();
  }
}
