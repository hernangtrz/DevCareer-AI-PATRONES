"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeniorityReadinessVisitor = void 0;
/**
 * ============================================================================
 * PATRÓN VISITOR: Visitante Concreto 1 (SeniorityReadinessVisitor)
 * ============================================================================
 * Realiza una auditoría holística de nivel profesional sobre todos los elementos
 * del candidato para dictaminar con qué seniority puede competir en el mercado.
 *
 * Cada método `visit*` evalúa los criterios de su elemento concreto sin acoplar
 * las clases de datos a la lógica de ponderación ni a las reglas de reclutamiento.
 */
class SeniorityReadinessVisitor {
    constructor() {
        this.visitorName = "SeniorityReadinessVisitor";
        this.interviewScores = [];
        this.englishLevels = [];
        this.codeChallengeScores = [];
        this.cyclomaticComplexities = [];
        this.applicationMatchScores = [];
        this.appliedSeniorities = [];
        this.atsScores = [];
    }
    visitInterview(interview) {
        if (!interview.finalized)
            return;
        // Ponderación técnica (70%) y comunicativa (30%)
        const interviewCombined = Math.round(interview.technicalScore * 0.7 + interview.communicationScore * 0.3);
        this.interviewScores.push(interviewCombined);
        this.englishLevels.push(interview.cefrLevel);
    }
    visitCodeChallenge(challenge) {
        // Evalúa ratio de tests aprobados y score de código limpio
        const challengeCombined = Math.round(challenge.passRatio * 0.6 + challenge.cleanCodeScore * 0.4);
        this.codeChallengeScores.push(challengeCombined);
        this.cyclomaticComplexities.push(challenge.cyclomaticComplexity);
    }
    visitJobApplication(application) {
        this.applicationMatchScores.push(application.matchScore);
        this.appliedSeniorities.push(application.seniority);
    }
    visitCvAts(cvAnalysis) {
        let score = cvAnalysis.atsScore;
        if (cvAnalysis.hasClearSenioritySummary)
            score = Math.min(100, score + 5);
        this.atsScores.push(score);
    }
    /**
     * Genera el reporte consolidado de preparación y recomendación de nivel
     */
    getReport() {
        const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 50;
        const interviewMastery = avg(this.interviewScores);
        const codeQuality = avg(this.codeChallengeScores);
        const marketAttractiveness = avg(this.applicationMatchScores);
        const atsOptimization = avg(this.atsScores);
        // Ponderación global: 35% Entrevistas, 30% Código, 20% Postulaciones, 15% ATS
        const overallReadinessScore = Math.round(interviewMastery * 0.35 +
            codeQuality * 0.3 +
            marketAttractiveness * 0.2 +
            atsOptimization * 0.15);
        const criteriaBreakdown = [];
        // Nivel de inglés más frecuente o representativo
        const hasAdvancedEnglish = this.englishLevels.some((l) => ["B2", "C1", "C2"].includes(l));
        if (hasAdvancedEnglish) {
            criteriaBreakdown.push("Fluidez de inglés validada (Nivel B2/C1)");
        }
        else {
            criteriaBreakdown.push("Inglés técnico en nivel intermedio/básico (A2/B1)");
        }
        // Complejidad algorítmica
        const avgComplexity = avg(this.cyclomaticComplexities);
        if (avgComplexity <= 10) {
            criteriaBreakdown.push("Control de complejidad ciclomática excelente (<= 10)");
        }
        else {
            criteriaBreakdown.push("Código con alta complejidad ciclomática (requiere refactorización)");
        }
        // Diagnóstico de nivel
        let recommendedLevel = "Junior";
        let verdict = "";
        if (overallReadinessScore >= 85 && hasAdvancedEnglish && avgComplexity <= 8) {
            recommendedLevel = "Lead / Staff";
            verdict = "Candidato con perfil de liderazgo técnico, alta solidez de arquitectura y fluidez bilingüe completa.";
        }
        else if (overallReadinessScore >= 75 && hasAdvancedEnglish) {
            recommendedLevel = "Senior";
            verdict = "Candidato calificado para posiciones Senior internacionales; domina stack técnico y comunicación profesional.";
        }
        else if (overallReadinessScore >= 60) {
            recommendedLevel = "Mid-Level";
            verdict = "Perfil competente para desarrollo autónomo; se recomienda reforzar patrones de arquitectura e inglés conversacional.";
        }
        else {
            recommendedLevel = "Junior";
            verdict = "En etapa formativa; debe consolidar resolución de retos de código y simulacros técnicos guiados.";
        }
        const analyzedElementsCount = this.interviewScores.length +
            this.codeChallengeScores.length +
            this.applicationMatchScores.length +
            this.atsScores.length;
        return {
            visitorName: this.visitorName,
            recommendedLevel,
            overallReadinessScore,
            categoryScores: {
                interviewMastery,
                codeQuality,
                marketAttractiveness,
                atsOptimization,
            },
            verdict,
            criteriaBreakdown,
            analyzedElementsCount,
        };
    }
}
exports.SeniorityReadinessVisitor = SeniorityReadinessVisitor;
//# sourceMappingURL=seniority-readiness.visitor.js.map