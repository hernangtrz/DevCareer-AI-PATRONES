"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationElement = void 0;
/**
 * ============================================================================
 * PATRÓN VISITOR: Elemento Concreto 3 (JobApplicationElement)
 * ============================================================================
 * Representa una postulación activa o histórica a un empleo tecnológico.
 * Implementa el método `accept` redirigiendo al visitante hacia `visitJobApplication(this)`.
 */
class JobApplicationElement {
    constructor(data) {
        this.elementType = "job_application";
        this.id = data.id;
        this.jobTitle = data.jobTitle;
        this.company = data.company;
        this.status = data.status;
        this.matchScore = Math.max(0, Math.min(100, data.matchScore));
        this.seniority = data.seniority;
        this.salaryUSD = data.salaryUSD;
        this.platform = data.platform;
        this.notes = data.notes;
        this.techStack = data.techStack ? [...data.techStack] : [];
        this.timestamp = data.timestamp || new Date().toISOString();
    }
    /**
     * Doble despacho hacia el método especializado del visitante
     */
    accept(visitor) {
        visitor.visitJobApplication(this);
    }
}
exports.JobApplicationElement = JobApplicationElement;
//# sourceMappingURL=job-application.element.js.map