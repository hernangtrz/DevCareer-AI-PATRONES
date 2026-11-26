import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import {
  ExecutiveHighlight,
  IReportRenderer,
  KeyValueItem,
  ScoreMetricItem,
} from "../report-renderer.interface";
import {
  InterviewFeedbackReportSchema,
  InterviewReportContextSchema,
} from "../report-schemas";

export interface InterviewReportContext {
  candidateName?: string;
  role?: string;
  company?: string;
  level?: string;
  interviewType?: string;
  techstack?: string[];
}

function getReadinessProfile(score: number): {
  label: string;
  status: "high" | "mid" | "low";
  summary: string;
} {
  if (score >= 85) {
    return {
      label: "Sobresaliente · Listo para Entrevista Final",
      status: "high",
      summary:
        "Demostraste un dominio técnico y comunicativo destacado. Tus respuestas muestran madurez profesional y alta preparación para avanzar a etapas finales de selección.",
    };
  }
  if (score >= 70) {
    return {
      label: "Sólido · Perfil Competitivo",
      status: "high",
      summary:
        "Tu desempeño es consistente y competitivo para el rol evaluado. Afinando algunos puntos específicos de profundidad y estructura podrás destacar aún más frente a otros candidatos.",
    };
  }
  if (score >= 50) {
    return {
      label: "En Desarrollo · Base Prometedora",
      status: "mid",
      summary:
        "Cuentas con fundamentos útiles, pero existen brechas puntuales que conviene reforzar antes de una entrevista real. Enfócate en las dimensiones prioritarias listadas abajo.",
    };
  }
  return {
    label: "Prioritario · Requiere Práctica Guiada",
    status: "low",
    summary:
      "Esta sesión detectó oportunidades importantes de mejora en estructura de respuesta o dominio del rol. Te recomendamos practicar con el plan de acción paso a paso y repetir la simulación.",
  };
}

/**
 * Refined Abstraction: Reporte ejecutivo de desempeño de entrevista
 * (resumen ejecutivo + contexto del rol + gráficos de 5 competencias + fortalezas + plan de mejora).
 */
export class InterviewFeedbackReport extends PerformanceReport {
  constructor(
    private feedback: Feedback,
    renderer: IReportRenderer,
    private context?: InterviewReportContext
  ) {
    super(renderer);
  }

  protected getTitle(): string {
    if (this.context?.role) {
      return `Reporte de Entrevista: ${this.context.role} — DevCareer AI`;
    }
    return "Reporte de Desempeño - Entrevista DevCareer AI";
  }

  protected getBaseFilename(): string {
    return `feedback-entrevista-${this.feedback.interviewId}`;
  }

  protected buildBlocks(): string[] {
    const r = this.renderer;
    const f = InterviewFeedbackReportSchema.parse(this.feedback);
    const ctx = InterviewReportContextSchema.parse(this.context);

    const date = f.createdAt
      ? new Date(f.createdAt).toLocaleString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "No registrada";

    const categories: ScoreMetricItem[] = (f.categoryScores || []).map((c) => ({
      label: c.name,
      score: c.score,
      max: 100,
      comment: c.comment,
    }));

    const readiness = getReadinessProfile(f.totalScore);
    const sorted = [...categories].sort((a, b) => b.score - a.score);
    const strongest = sorted[0];
    const priority = sorted[sorted.length - 1];

    const summaryExtras: string[] = [];
    if (strongest) {
      summaryExtras.push(
        `Tu mayor fortaleza fue "${strongest.label}" (${strongest.score}/100).`
      );
    }
    if (priority && priority.label !== strongest?.label) {
      summaryExtras.push(
        `Tu principal oportunidad de mejora está en "${priority.label}" (${priority.score}/100).`
      );
    }

    const badges: string[] = [];
    if (ctx?.role) badges.push(ctx.role);
    if (ctx?.level) badges.push(`Nivel ${ctx.level}`);
    if (ctx?.company) badges.push(ctx.company);
    if (f.englishFeedback?.overallLevel) {
      badges.push(`Inglés CEFR ${f.englishFeedback.overallLevel}`);
    }
    if (f.facialFeedback?.overallScore !== undefined) {
      badges.push(`Presencia No Verbal ${f.facialFeedback.overallScore}/100`);
    }

    const highlight: ExecutiveHighlight = {
      score: f.totalScore,
      max: 100,
      verdictLabel: readiness.label,
      verdictSummary: [readiness.summary, ...summaryExtras].join(" "),
      status: readiness.status,
      badges: badges.length > 0 ? badges : undefined,
    };

    const metaItems: KeyValueItem[] = [
      ...(ctx?.candidateName ? [{ key: "Candidato", value: ctx.candidateName }] : []),
      ...(ctx?.role ? [{ key: "Rol Evaluado", value: ctx.role }] : []),
      ...(ctx?.company ? [{ key: "Empresa / Contexto", value: ctx.company }] : []),
      ...(ctx?.level ? [{ key: "Seniority", value: ctx.level }] : []),
      ...(ctx?.interviewType ? [{ key: "Modalidad", value: ctx.interviewType }] : []),
      ...(ctx?.techstack && ctx.techstack.length > 0
        ? [{ key: "Stack Tecnológico", value: ctx.techstack.join(", ") }]
        : []),
      { key: "ID de Sesión", value: f.interviewId },
      { key: "Fecha de Evaluación", value: date },
    ];

    const blocks: string[] = [];

    // 1. Resumen ejecutivo con gauge / barra de progreso
    if (r.renderExecutiveSummary) {
      blocks.push(r.renderExecutiveSummary(highlight));
    } else {
      blocks.push(r.renderSection("Puntaje Global"));
      blocks.push(r.renderScore("Total", f.totalScore, 100, readiness.label));
    }

    // 2. Ficha de datos de la entrevista
    if (r.renderKeyValueGrid) {
      blocks.push(r.renderKeyValueGrid(metaItems));
    } else {
      metaItems.forEach((item) => blocks.push(r.renderKeyValue(item.key, item.value)));
    }

    // 3. Resumen visual comparativo (Radar + Barras en HTML, Tabla visual en MD, Barras ASCII en TXT)
    if (categories.length > 0) {
      if (r.renderChartSummary) {
        blocks.push(
          r.renderChartSummary("Panorama Visual de Competencias Evaluadas", categories)
        );
      }

      blocks.push(r.renderSection("Detalle por Dimensión Evaluada"));
      categories.forEach((c) => {
        blocks.push(r.renderScore(c.label, c.score, c.max, c.comment));
      });
    }

    // 4. Fortalezas
    blocks.push(r.renderSection("Fortalezas Destacadas"));
    const strengths = f.strengths || [];
    blocks.push(
      r.renderListWithTone ? r.renderListWithTone(strengths, "positive") : r.renderList(strengths)
    );

    // 5. Áreas de mejora
    blocks.push(r.renderSection("Áreas Prioritarias de Mejora"));
    const improvements = f.areasForImprovement || [];
    blocks.push(
      r.renderListWithTone
        ? r.renderListWithTone(improvements, "improvement")
        : r.renderList(improvements)
    );

    // 6. Plan de acción práctico (fácil de entender y ejecutar)
    const actionPlan: string[] = [];
    if (priority && priority.score < 80) {
      actionPlan.push(
        `Dedica tu próxima práctica a reforzar "${priority.label}" (actualmente ${priority.score}/100) usando respuestas estructuradas con el método STAR (Situación, Tarea, Acción, Resultado).`
      );
    }
    if (improvements[0]) {
      actionPlan.push(`Atiende como prioridad inmediata: ${improvements[0]}`);
    }
    if (ctx?.techstack && ctx.techstack.length > 0) {
      actionPlan.push(
        `Prepara 2 ejemplos concretos de decisiones técnicas y trade-offs recientes usando ${ctx.techstack.slice(0, 3).join(", ")}.`
      );
    }
    actionPlan.push(
      "Repite esta simulación en DevCareer AI en 3–5 días para medir tu evolución frente a la meta de 80/100."
    );

    blocks.push(r.renderSection("Plan de Acción Recomendado"));
    blocks.push(
      r.renderListWithTone ? r.renderListWithTone(actionPlan, "action") : r.renderList(actionPlan)
    );

    // 7. Evaluaciones complementarias si existen en el mismo feedback
    if (f.englishFeedback || f.facialFeedback) {
      const complementary: ScoreMetricItem[] = [];
      if (f.englishFeedback) {
        const avgEn = Math.round(
          (f.englishFeedback.grammarScore +
            f.englishFeedback.vocabularyScore +
            f.englishFeedback.fluencyScore) /
            3
        );
        complementary.push({
          label: `Inglés Técnico (Nivel CEFR ${f.englishFeedback.overallLevel})`,
          score: avgEn,
          max: 100,
          comment: f.englishFeedback.overallComment,
        });
      }
      if (f.facialFeedback) {
        complementary.push({
          label: `Presencia No Verbal (${f.facialFeedback.expressiveProfile})`,
          score: f.facialFeedback.overallScore,
          max: 100,
          comment: f.facialFeedback.summaryComment,
        });
      }
      blocks.push(r.renderSection("Evaluaciones Complementarias"));
      complementary.forEach((item) =>
        blocks.push(r.renderScore(item.label, item.score, item.max, item.comment))
      );
    }

    // 8. Dictamen final del evaluador IA
    blocks.push(r.renderSection("Dictamen Final del Evaluador IA"));
    blocks.push(
      r.renderParagraph(
        f.finalAssessment ||
          "No se registró un dictamen final detallado para esta sesión."
      )
    );

    return blocks;
  }
}
