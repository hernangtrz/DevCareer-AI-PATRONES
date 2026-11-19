import { ICareerVisitor } from "../career-visitor.interface";
import { InterviewSessionElement } from "../elements/interview-session.element";
import { CodeChallengeElement } from "../elements/code-challenge.element";
import { JobApplicationElement } from "../elements/job-application.element";
import { CvAtsAnalysisElement } from "../elements/cv-ats-analysis.element";

export interface ExecutivePortfolioSummary {
  visitorName: string;
  candidateSummary: string;
  totalInterviews: number;
  averageInterviewScore: number;
  topCefrLevel: string;
  challengesCompleted: number;
  codePassRate: number;
  activeApplicationsCount: number;
  topMatchedSkills: string[];
  portfolioHighlights: string[];
  readyForExport: boolean;
}

/**
 * ============================================================================
 * PATRÓN VISITOR: Visitante Concreto 3 (ExecutivePortfolioVisitor)
 * ============================================================================
 * Transforma y consolida los elementos heterogéneos del candidato en un
 * dossier ejecutivo de alto impacto, formateado para presentación ante reclutadores.
 */
export class ExecutivePortfolioVisitor implements ICareerVisitor {
  public readonly visitorName = "ExecutivePortfolioVisitor";

  private interviewsCount = 0;
  private interviewScores: number[] = [];
  private cefrLevels: string[] = [];

  private challengesCount = 0;
  private challengePassRates: number[] = [];
  private masteredLanguages = new Set<string>();

  private applicationsCount = 0;
  private activePipelineCompanies: string[] = [];
  private skillsSet = new Set<string>();

  private atsScores: number[] = [];
  private targetRoles: string[] = [];

  public visitInterview(interview: InterviewSessionElement): void {
    this.interviewsCount++;
    this.interviewScores.push(interview.technicalScore);
    this.cefrLevels.push(interview.cefrLevel);
    interview.techStack.forEach((tech) => this.skillsSet.add(tech));
  }

  public visitCodeChallenge(challenge: CodeChallengeElement): void {
    this.challengesCount++;
    this.challengePassRates.push(challenge.passRatio);
    this.masteredLanguages.add(challenge.language);
  }

  public visitJobApplication(application: JobApplicationElement): void {
    this.applicationsCount++;
    if (["applied", "interviewing", "offered"].includes(application.status)) {
      this.activePipelineCompanies.push(application.company);
    }
    application.techStack.forEach((t) => this.skillsSet.add(t));
  }

  public visitCvAts(cvAnalysis: CvAtsAnalysisElement): void {
    this.atsScores.push(cvAnalysis.atsScore);
    this.targetRoles.push(cvAnalysis.targetRole);
    cvAnalysis.matchedKeywords.forEach((k) => this.skillsSet.add(k));
  }

  /**
   * Genera el resumen consolidado para el portafolio ejecutivo
   */
  public getSummary(): ExecutivePortfolioSummary {
    const avg = (arr: number[]) =>
      arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const averageInterviewScore = avg(this.interviewScores);
    const codePassRate = avg(this.challengePassRates);

    // Determinar mejor nivel de inglés registrado
    const cefrRank: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
    let topCefrLevel = "B2";
    let maxRank = 0;
    this.cefrLevels.forEach((l) => {
      const r = cefrRank[l] || 0;
      if (r > maxRank) {
        maxRank = r;
        topCefrLevel = l;
      }
    });

    const portfolioHighlights: string[] = [];
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
