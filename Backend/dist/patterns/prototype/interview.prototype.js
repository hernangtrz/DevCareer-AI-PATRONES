"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewPrototype = void 0;
/**
 * Entidad Concreta Prototype: InterviewPrototype
 *
 * Implementa el Patrón Prototype (GoF). Permite crear copias profundas (Deep Copy)
 * de estructuras de entrevistas preconfiguradas o existentes en el historial,
 * garantizando que las modificaciones sobre las listas anidadas (preguntas, techstack)
 * no contaminen el arquetipo original ni a otros clones en memoria.
 */
class InterviewPrototype {
    constructor(data) {
        this.role = data.role;
        this.level = data.level;
        this.type = data.type;
        // Deep copy de arrays para garantizar aislamiento desde la construcción
        this.techstack = Array.isArray(data.techstack) ? [...data.techstack] : [];
        this.questions = Array.isArray(data.questions) ? [...data.questions] : [];
        this.coverImage = data.coverImage;
        this.userId = data.userId || "unassigned";
        this.finalized = data.finalized ?? false;
        this.createdAt = data.createdAt || new Date().toISOString();
    }
    /**
     * Realiza un Deep Clone de la entrevista.
     * Duplica los arrays primitivos para evitar que mutaciones de elementos
     * compartan la misma referencia en memoria.
     */
    clone() {
        return new InterviewPrototype({
            role: this.role,
            level: this.level,
            type: this.type,
            techstack: [...this.techstack],
            questions: [...this.questions],
            coverImage: this.coverImage,
            userId: this.userId,
            finalized: this.finalized,
            createdAt: new Date().toISOString(), // Nuevo timestamp para la instancia clonada
        });
    }
    /**
     * Ajusta el clon para un usuario específico y resetea metadatos de sesión.
     * Ideal para cuando se toma un arquetipo/plantilla y se asigna al usuario que inicia sesión.
     */
    prepareForUser(newUserId, options = {}) {
        this.userId = newUserId;
        this.createdAt = new Date().toISOString();
        if (options.finalized !== undefined) {
            this.finalized = options.finalized;
        }
        return this;
    }
    /**
     * Permite agregar preguntas adicionales al clon sin afectar el prototipo base.
     */
    addQuestion(question) {
        if (question && question.trim()) {
            this.questions.push(question.trim());
        }
        return this;
    }
    /**
     * Exporta la información del prototipo al formato DTO requerido por la capa de persistencia.
     */
    toEntity() {
        return {
            role: this.role,
            level: this.level,
            type: this.type,
            techstack: [...this.techstack],
            questions: [...this.questions],
            coverImage: this.coverImage,
            userId: this.userId,
            finalized: this.finalized,
            createdAt: this.createdAt,
        };
    }
    /**
     * Método de fábrica para instanciar un Prototype desde un objeto Interview de la base de datos.
     */
    static fromEntity(interview) {
        return new InterviewPrototype({
            role: interview.role,
            level: interview.level,
            type: interview.type,
            techstack: interview.techstack,
            questions: interview.questions,
            coverImage: interview.coverImage,
            userId: interview.userId,
            finalized: interview.finalized,
            createdAt: interview.createdAt,
        });
    }
}
exports.InterviewPrototype = InterviewPrototype;
//# sourceMappingURL=interview.prototype.js.map