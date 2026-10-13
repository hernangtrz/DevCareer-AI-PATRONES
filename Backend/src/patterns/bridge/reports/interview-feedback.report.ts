import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";

/**
 * Refined Abstraction: Reporte de desempeño de la entrevista (puntaje global + 5 categorías).
 */
export class InterviewFeedbackReport extends PerformanceReport {
  constructor(private feedback: Feedback, renderer: IReportRenderer) {
    super(renderer);
  }

  protected getTitle(): string {
    return "Reporte de Desempeño - Entrevista DevCareer AI";
  }

  protected getBaseFilename(): string {
    return `feedback-entrevista-${this.feedback.interviewId}`;
  }

  protected buildBlocks(): string[] {
    const r = this.renderer;
    const f = this.feedback;
    const date = f.createdAt ? new Date(f.createdAt).toLocaleString("es-CO") : "N/D";

    return [
      r.renderKeyValue("Entrevista", f.interviewId),
      r.renderKeyValue("Fecha", date),
      r.renderSection("Puntaje Global"),
      r.renderScore("Total", f.totalScore, 100),
      r.renderSection("Evaluación por Categorías"),
      ...(f.categoryScores || []).map((c) => r.renderScore(c.name, c.score, 100, c.comment)),
      r.renderSection("Fortalezas"),
      r.renderList(f.strengths || []),
      r.renderSection("Áreas de Mejora"),
      r.renderList(f.areasForImprovement || []),
      r.renderSection("Dictamen Final"),
      r.renderParagraph(f.finalAssessment || ""),
    ];
  }
}
