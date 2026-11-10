import { BaseColleague } from "../base.colleague";
import { ICareerMediator } from "../career-mediator.interface";

export interface ReadinessAlert {
  id: string;
  userId: string;
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  recommendedAction: string;
  createdAt: string;
}

export interface CoordinatedMilestone {
  id: string;
  userId: string;
  type: "application" | "interview_stage" | "evaluation" | "skill_gap";
  summary: string;
  score?: number;
  timestamp: string;
}

/**
 * ============================================================================
 * PATRÓN MEDIATOR (GoF) — ConcreteColleague 4: CandidateAnalyticsColleague
 * ============================================================================
 * Gestiona el registro de hitos transversales y alertas proactivas de puntos
 * ciegos (blindspots) del candidato en respuesta a las coordinaciones del Mediador.
 */
export class CandidateAnalyticsColleague extends BaseColleague {
  public readonly colleagueName = "CandidateAnalyticsColleague";

  private alertsByUser: Map<string, ReadinessAlert[]> = new Map();
  private milestonesByUser: Map<string, CoordinatedMilestone[]> = new Map();

  constructor(mediator?: ICareerMediator) {
    super(mediator);
  }

  /**
   * Invocado por el Mediador para registrar un hito transversal de actividad.
   */
  public recordMilestone(params: {
    userId: string;
    type: CoordinatedMilestone["type"];
    summary: string;
    score?: number;
  }): CoordinatedMilestone {
    const milestone: CoordinatedMilestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: params.userId,
      type: params.type,
      summary: params.summary,
      score: params.score,
      timestamp: new Date().toISOString(),
    };

    const current = this.milestonesByUser.get(params.userId) || [];
    current.unshift(milestone);
    this.milestonesByUser.set(params.userId, current.slice(0, 30));

    return milestone;
  }

  /**
   * Invocado por el Mediador cuando una evaluación de entrevista o análisis técnico
   * revela áreas de mejora críticas o puntajes por debajo del objetivo.
   */
  public registerEvaluationInsights(params: {
    userId: string;
    interviewId: string;
    totalScore: number;
    cefrLevel?: string;
    areasForImprovement: string[];
    role?: string;
  }): ReadinessAlert[] {
    const { userId, totalScore, cefrLevel, areasForImprovement, role } = params;
    const generated: ReadinessAlert[] = [];
    const current = this.alertsByUser.get(userId) || [];

    if (totalScore < 75 || areasForImprovement.length > 0) {
      const topArea =
        areasForImprovement[0] ||
        "Profundizar en patrones de arquitectura y justificación de trade-offs técnicos.";

      generated.push({
        id: `alert-${Date.now()}-tech`,
        userId,
        severity: totalScore < 60 ? "high" : "medium",
        category: role ? `Entrevista (${role})` : "Desempeño en Entrevista",
        message: topArea,
        recommendedAction:
          "Practicar respuestas bajo metodología STAR y reforzar los conceptos señalados antes de la entrevista real.",
        createdAt: new Date().toISOString(),
      });
    }

    if (cefrLevel && (cefrLevel.startsWith("A") || cefrLevel.startsWith("B1"))) {
      generated.push({
        id: `alert-${Date.now()}-cefr`,
        userId,
        severity: "medium",
        category: "Competencia Lingüística CEFR",
        message: `Nivel de inglés detectado (${cefrLevel}). Se recomienda alcanzar B2+ para roles remotos globales.`,
        recommendedAction:
          "Realizar simulacros adicionales con los entrevistadores en inglés (Katie o Daniel).",
        createdAt: new Date().toISOString(),
      });
    }

    if (generated.length > 0) {
      this.alertsByUser.set(userId, [...generated, ...current].slice(0, 20));
    }

    return generated;
  }

  /**
   * Invocado por el Mediador cuando se detectan palabras clave faltantes en CV ATS
   * o fallos de principios SOLID en retos de código.
   */
  public registerSkillGapAlert(params: {
    userId: string;
    source: "cv-ats" | "code-challenge";
    targetRole: string;
    missingSkills: string[];
    score: number;
  }): ReadinessAlert {
    const { userId, source, targetRole, missingSkills, score } = params;
    const alert: ReadinessAlert = {
      id: `alert-${Date.now()}-gap`,
      userId,
      severity: score < 65 ? "high" : "medium",
      category: source === "cv-ats" ? "Brecha ATS en CV" : "Auditoría de Código & SOLID",
      message: `Brechas detectadas para ${targetRole}: ${missingSkills.join(", ")}.`,
      recommendedAction:
        "Completar el simulacro de refuerzo generado automáticamente por el Mediador.",
      createdAt: new Date().toISOString(),
    };

    const current = this.alertsByUser.get(userId) || [];
    this.alertsByUser.set(userId, [alert, ...current].slice(0, 20));
    return alert;
  }

  public getAlertsForUser(userId: string): ReadinessAlert[] {
    return this.alertsByUser.get(userId) || [];
  }

  public getMilestonesForUser(userId: string): CoordinatedMilestone[] {
    return this.milestonesByUser.get(userId) || [];
  }
}

