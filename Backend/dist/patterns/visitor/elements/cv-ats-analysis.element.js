"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvAtsAnalysisElement = void 0;
/**
 * ============================================================================
 * PATRÓN VISITOR: Elemento Concreto 4 (CvAtsAnalysisElement)
 * ============================================================================
 * Representa el resultado del análisis de un currículum contra filtros ATS.
 * Implementa el método `accept` redirigiendo al visitante hacia `visitCvAts(this)`.
 */
class CvAtsAnalysisElement {
    constructor(data) {
        this.elementType = "cv_ats";
        this.id = data.id;
        this.targetRole = data.targetRole;
        this.atsScore = Math.max(0, Math.min(100, data.atsScore));
        this.matchedKeywords = [...data.matchedKeywords];
        this.missingKeywords = [...data.missingKeywords];
        this.formattingIssues = [...data.formattingIssues];
        this.hasClearSenioritySummary = data.hasClearSenioritySummary;
        this.timestamp = data.timestamp || new Date().toISOString();
    }
    /**
     * Doble despacho hacia el método especializado del visitante
     */
    accept(visitor) {
        visitor.visitCvAts(this);
    }
}
exports.CvAtsAnalysisElement = CvAtsAnalysisElement;
//# sourceMappingURL=cv-ats-analysis.element.js.map