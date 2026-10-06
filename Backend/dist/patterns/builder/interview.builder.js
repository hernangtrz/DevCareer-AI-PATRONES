"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewBuilder = void 0;
const constants_1 = require("../../config/constants");
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
class InterviewBuilder {
    constructor() {
        this.userId = "";
        this.role = "";
        this.level = "";
        this.type = "";
        this.techstack = [];
        this.questions = [];
        this.finalized = false;
        this.createdAt = new Date().toISOString();
        this.reset();
    }
    reset() {
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
    forUser(userId) {
        this.userId = userId ? userId.trim() : "";
        return this;
    }
    withRole(role) {
        this.role = role ? role.trim() : "";
        return this;
    }
    withLevel(level) {
        this.level = level ? level.trim() : "";
        return this;
    }
    ofType(type) {
        this.type = type ? type.trim() : "";
        return this;
    }
    withTechStack(techstack) {
        if (Array.isArray(techstack)) {
            this.techstack = techstack
                .map((t) => (typeof t === "string" ? t.trim() : ""))
                .filter((t) => t.length > 0);
        }
        else {
            this.techstack = [];
        }
        return this;
    }
    addTech(tech) {
        if (tech && typeof tech === "string" && tech.trim()) {
            const sanitized = tech.trim();
            if (!this.techstack.includes(sanitized)) {
                this.techstack.push(sanitized);
            }
        }
        return this;
    }
    withQuestions(questions) {
        if (Array.isArray(questions)) {
            this.questions = questions
                .map((q) => (typeof q === "string" ? q.trim() : ""))
                .filter((q) => q.length > 0);
        }
        else {
            this.questions = [];
        }
        return this;
    }
    addQuestion(question) {
        if (question && typeof question === "string" && question.trim()) {
            this.questions.push(question.trim());
        }
        return this;
    }
    withCoverImage(coverImage) {
        this.coverImage = coverImage && coverImage.trim() ? coverImage.trim() : undefined;
        return this;
    }
    assignRandomCover() {
        this.coverImage = (0, constants_1.getRandomInterviewCover)();
        return this;
    }
    asDraft() {
        this.finalized = false;
        return this;
    }
    asFinalized() {
        this.finalized = true;
        return this;
    }
    /**
     * Finaliza el ensamble y valida que todos los invariantes del objeto sean correctos.
     * Lanza un error descriptivo si falta algún requerimiento esencial.
     */
    build() {
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
        const builtEntity = {
            userId: this.userId,
            role: this.role,
            level: this.level,
            type: this.type,
            techstack: [...this.techstack],
            questions: [...this.questions],
            coverImage: this.coverImage || (0, constants_1.getRandomInterviewCover)(),
            finalized: this.finalized,
            createdAt: this.createdAt || new Date().toISOString(),
        };
        return builtEntity;
    }
}
exports.InterviewBuilder = InterviewBuilder;
//# sourceMappingURL=interview.builder.js.map