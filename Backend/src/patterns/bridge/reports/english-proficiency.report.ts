import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";

type EnglishFeedback = NonNullable<Feedback["englishFeedback"]>;

/**
 * Refined Abstraction: Reporte de competencia en inglés (marco CEFR A1–C2).
 */
export class EnglishProficiencyReport extends PerformanceReport {
  constructor(
    private interviewId: string,
    private english: EnglishFeedback,
    renderer: IReportRenderer
  ) {
    super(renderer);
  }

  protected getTitle(): string {
    return "English Proficiency Report (CEFR) - DevCareer AI";
  }

  protected getBaseFilename(): string {
    return `english-cefr-${this.interviewId}`;
  }

  protected buildBlocks(): string[] {
    const r = this.renderer;
    const e = this.english;

    return [
      r.renderKeyValue("Interview", this.interviewId),
      r.renderKeyValue("CEFR Level", e.overallLevel),
      r.renderSection("Scores"),
      r.renderScore("Grammar", e.grammarScore, 100),
      r.renderScore("Vocabulary", e.vocabularyScore, 100),
      r.renderScore("Fluency", e.fluencyScore, 100),
      r.renderSection("Grammar Errors Detected"),
      r.renderList(e.grammarErrors || []),
      r.renderSection("Vocabulary Suggestions"),
      r.renderList(e.vocabularySuggestions || []),
      r.renderSection("Overall Comment"),
      r.renderParagraph(e.overallComment || ""),
    ];
  }
}
