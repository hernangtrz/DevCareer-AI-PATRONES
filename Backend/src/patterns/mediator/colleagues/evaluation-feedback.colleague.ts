import { BaseColleague } from "../base.colleague";
import { ICareerMediator } from "../career-mediator.interface";
import { Feedback } from "../../../types";

/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 3: EvaluationFeedbackColleague
 * ============================================================================
 * Representa al módulo de Evaluación de IA y Diagnóstico de Competencias.
 * Emite eventos hacia el Mediador cuando una entrevista o diagnóstico técnico
 * ha sido calificado, sin conocer ni depender de los módulos de Postulaciones,
 * Entrevistas o Analítica.
 */
export class EvaluationFeedbackColleague extends BaseColleague {
  public readonly colleagueName = "EvaluationFeedbackColleague";

  constructor(mediator?: ICareerMediator) {
    super(mediator);
  }

  /**
   * Notifica al Mediador que una entrevista ha sido evaluada exitosamente
   * para desencadenar la sincronización transversal del ecosistema.
   */
  public async notifyEvaluationCompleted(params: {
    feedbackId: string;
    feedback: Feedback;
    role?: string;
    company?: string;
  }): Promise<void> {
    const { feedbackId, feedback, role, company } = params;

    await this.emit("INTERVIEW_EVALUATED", {
      interviewId: feedback.interviewId,
      feedbackId,
      userId: feedback.userId,
      totalScore: feedback.totalScore,
      cefrLevel: feedback.englishFeedback?.overallLevel,
      strengths: feedback.strengths || [],
      areasForImprovement: feedback.areasForImprovement || [],
      role,
      company,
    });
  }

  /**
   * Notifica al Mediador cuando un análisis de CV ATS o un Reto de Código
   * detecta brechas técnicas que requieren entrenamiento focalizado.
   */
  public async notifySkillGapDetected(params: {
    userId: string;
    source: "cv-ats" | "code-challenge";
    targetRole: string;
    missingSkills: string[];
    score: number;
  }): Promise<void> {
    await this.emit("SKILL_GAP_DETECTED", params);
  }
}

