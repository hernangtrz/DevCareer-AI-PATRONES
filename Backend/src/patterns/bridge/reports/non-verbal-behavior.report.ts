import { Feedback } from "../../../types";
import { PerformanceReport } from "../performance-report.abstraction";
import { IReportRenderer } from "../report-renderer.interface";

type FacialFeedback = NonNullable<Feedback["facialFeedback"]>;

/**
 * ============================================================================
 * PATRÓN ESTRUCTURAL BRIDGE (GoF): NonVerbalBehaviorReport
 * ============================================================================
 * Refined Abstraction: Reporte especializado en lenguaje corporal, FACS,
 * micro-expresiones faciales, estabilidad postural y contacto visual.
 * Desacoplado de la implementación de renderizado (HTML, Markdown, PlainText).
 */
export class NonVerbalBehaviorReport extends PerformanceReport {
  constructor(
    private interviewId: string,
    private facial: FacialFeedback,
    renderer: IReportRenderer
  ) {
    super(renderer);
  }

  protected getTitle(): string {
    return "Reporte de Comportamiento No Verbal & Presencia Ejecutiva - DevCareer AI";
  }

  protected getBaseFilename(): string {
    return `feedback-conductual-${this.interviewId}`;
  }

  protected buildBlocks(): string[] {
    const r = this.renderer;
    const f = this.facial;
    const m = f.metrics;

    return [
      r.renderKeyValue("Entrevista", this.interviewId),
      r.renderKeyValue("Perfil Expresivo", f.expressiveProfile),
      r.renderKeyValue("Tasa de Parpadeo", `${m.blinkRatePerMin} / minuto`),
      r.renderKeyValue("Presencia en Encuadre", `${m.facePresencePercent}% de la sesión`),
      r.renderSection("Puntaje Global de Presencia"),
      r.renderScore("Presencia No Verbal", f.overallScore, 100),
      r.renderSection("Dimensiones Conductuales Evaluadas"),
      r.renderScore("Contacto Visual con la Cámara", m.eyeContact, 100),
      r.renderScore("Control de Tensión y Serenidad", m.composure, 100),
      r.renderScore("Equilibrio y Expresividad Gestual", m.gestureBalance, 100),
      r.renderScore("Estabilidad Postural", m.postureStability, 100),
      r.renderScore("Calidez y Conexión Emocional", m.warmth, 100),
      r.renderSection("Diagnóstico del Coach IA"),
      r.renderParagraph(f.summaryComment || ""),
      r.renderSection("Fortalezas Observadas"),
      r.renderList(f.strengths || []),
      r.renderSection("Hábitos a Mejorar"),
      r.renderList(f.habitsToImprove || []),
      r.renderSection("Plan de Micro-Ejercicios Prácticos"),
      r.renderList(f.coachingTips || []),
    ];
  }
}
