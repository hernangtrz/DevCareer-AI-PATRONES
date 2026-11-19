"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutivePortfolioVisitor = void 0;
/**
 * ============================================================================
 * PATRÓN VISITOR: Visitante Concreto 3 (ExecutivePortfolioVisitor)
 * ============================================================================
 * Transforma y consolida los elementos heterogéneos del candidato en un
 * dossier ejecutivo de alto impacto, formateado para presentación ante reclutadores.
 */
class ExecutivePortfolioVisitor {
    constructor() {
        this.visitorName = "ExecutivePortfolioVisitor";
        this.interviewsCount = 0;
        this.interviewScores = [];
        this.cefrLevels = [];
        this.challengesCount = 0;
        this.challengePassRates = [];
        this.masteredLanguages = new Set();
        this.applicationsCount = 0;
        this.activePipelineCompanies = [];
        this.skillsSet = new Set();
        this.atsScores = [];
        this.targetRoles = [];
    }
    visitInterview(interview) {
        this.interviewsCount++;
        this.interviewScores.push(interview.technicalScore);
        this.cefrLevels.push(interview.cefrLevel);
        interview.techStack.forEach((tech) => this.skillsSet.add(tech));
    }
    visitCodeChallenge(challenge) {
        this.challengesCount++;
        this.challengePassRates.push(challenge.passRatio);
        this.masteredLanguages.add(challenge.language);
    }
    visitJobApplication(application) {
        this.applicationsCount++;
        if (["applied", "interviewing", "offered"].includes(application.status)) {
            this.activePipelineCompanies.push(application.company);
        }
        application.techStack.forEach((t) => this.skillsSet.add(t));
    }
    visitCvAts(cvAnalysis) {
        this.atsScores.push(cvAnalysis.atsScore);
        this.targetRoles.push(cvAnalysis.targetRole);
        cvAnalysis.matchedKeywords.forEach((k) => this.skillsSet.add(k));
    }
    /**
     * Genera el resumen consolidado para el portafolio ejecutivo
     */
    getSummary() {
        const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        const averageInterviewScore = avg(this.interviewScores);
        const codePassRate = avg(this.challengePassRates);
        // Determinar mejor nivel de inglés registrado
        const cefrRank = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
        let topCefrLevel = "B2";
        let maxRank = 0;
        this.cefrLevels.forEach((l) => {
            const r = cefrRank[l] || 0;
            if (r > maxRank) {
                maxRank = r;
                topCefrLevel = l;
            }
        });
        const portfolioHighlights = [];
        if (averageInterviewScore >= 80) {
            portfolioHighlights.push(`Excelente solidez en simulacros técnicos (${averageInterviewScore}/100 de media).`);
        }
        if (codePassRate >= 85) {
            portfolioHighlights.push(`Alta tasa de éxito en retos algorítmicos (${codePassRate}% tests aprobados).`);
        }
        if (this.masteredLanguages.size > 0) {
            portfolioHighlights.push(`Dominio políglota demostrado en: ${Array.from(this.masteredLanguages).join(", ")}.`);
        }
        if (this.activePipelineCompanies.length > 0) {
            portfolioHighlights.push(`Procesos activos de postulación en: ${this.activePipelineCompanies.slice(0, 3).join(", ")}.`);
        }
        const candidateSummary = `Ingeniero de software con ${this.interviewsCount} simulacro(s) técnico(s) evaluado(s), nivel de inglés ${topCefrLevel} certificado por IA y ${this.challengesCount} reto(s) de código completado(s). Stack validado: ${Array.from(this.skillsSet).slice(0, 5).join(", ")}.`;
        return {
            visitorName: this.visitorName,
            candidateSummary,
            totalInterviews: this.interviewsCount,
            averageInterviewScore,
            topCefrLevel,
            challengesCompleted: this.challengesCount,
            codePassRate,
            activeApplicationsCount: this.activePipelineCompanies.length,
            topMatchedSkills: Array.from(this.skillsSet).slice(0, 8),
            portfolioHighlights,
            readyForExport: this.interviewsCount > 0 || this.challengesCount > 0,
        };
    }
}
exports.ExecutivePortfolioVisitor = ExecutivePortfolioVisitor;
//# sourceMappingURL=executive-portfolio.visitor.js.map