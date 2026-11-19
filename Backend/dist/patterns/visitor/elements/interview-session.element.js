"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewSessionElement = void 0;
/**
 * ============================================================================
 * PATRÓN VISITOR: Elemento Concreto 1 (InterviewSessionElement)
 * ============================================================================
 * Representa una sesión de entrevista técnica o comportamental simulada.
 * Implementa el método `accept` redirigiendo al visitante hacia `visitInterview(this)`.
 */
class InterviewSessionElement {
    constructor(data) {
        this.elementType = "interview";
        this.id = data.id;
        this.role = data.role;
        this.company = data.company;
        this.technicalScore = Math.max(0, Math.min(100, data.technicalScore));
        this.communicationScore = Math.max(0, Math.min(100, data.communicationScore));
        this.cefrLevel = data.cefrLevel;
        this.techStack = [...data.techStack];
        this.finalized = data.finalized;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.feedbackSummary = data.feedbackSummary;
    }
    /**
     * Doble despacho hacia el método especializado del visitante
     */
    accept(visitor) {
        visitor.visitInterview(this);
    }
}
exports.InterviewSessionElement = InterviewSessionElement;
//# sourceMappingURL=interview-session.element.js.map