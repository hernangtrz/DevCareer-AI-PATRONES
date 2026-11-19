"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeChallengeElement = void 0;
/**
 * ============================================================================
 * PATRÓN VISITOR: Elemento Concreto 2 (CodeChallengeElement)
 * ============================================================================
 * Representa la solución a un reto de código y algoritmia técnica.
 * Implementa el método `accept` redirigiendo al visitante hacia `visitCodeChallenge(this)`.
 */
class CodeChallengeElement {
    constructor(data) {
        this.elementType = "code_challenge";
        this.id = data.id;
        this.challengeTitle = data.challengeTitle;
        this.language = data.language;
        this.difficulty = data.difficulty;
        this.testsPassed = Math.max(0, data.testsPassed);
        this.totalTests = Math.max(1, data.totalTests);
        this.cyclomaticComplexity = Math.max(1, data.cyclomaticComplexity);
        this.executionTimeMs = Math.max(0, data.executionTimeMs);
        this.cleanCodeScore = Math.max(0, Math.min(100, data.cleanCodeScore));
        this.passed = data.passed;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.codeSnippet = data.codeSnippet;
    }
    /**
     * Retorna el porcentaje de tests unitarios aprobados
     */
    get passRatio() {
        return Math.round((this.testsPassed / this.totalTests) * 100);
    }
    /**
     * Doble despacho hacia el método especializado del visitante
     */
    accept(visitor) {
        visitor.visitCodeChallenge(this);
    }
}
exports.CodeChallengeElement = CodeChallengeElement;
//# sourceMappingURL=code-challenge.element.js.map