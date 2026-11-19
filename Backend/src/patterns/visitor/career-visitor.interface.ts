import { InterviewSessionElement } from "./elements/interview-session.element";
import { CodeChallengeElement } from "./elements/code-challenge.element";
import { JobApplicationElement } from "./elements/job-application.element";
import { CvAtsAnalysisElement } from "./elements/cv-ats-analysis.element";

/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL VISITOR (GoF): Visitante Base (Visitor Interface)
 * ============================================================================
 * Declara una serie de métodos de visita que corresponden a cada clase concreta
 * de elemento en la estructura del expediente del candidato.
 *
 * La firma de cada método identifica la clase del elemento concreto visitado,
 * permitiendo que el visitante acceda directamente a su interfaz pública
 * sin necesidad de conversiones de tipo (`instanceof`) ni condicionales.
 */
export interface ICareerVisitor {
  readonly visitorName: string;

  /**
   * Visita una sesión de entrevista técnica o de voz
   */
  visitInterview(interview: InterviewSessionElement): void;

  /**
   * Visita la solución a un reto de código técnico
   */
  visitCodeChallenge(challenge: CodeChallengeElement): void;

  /**
   * Visita una postulación a vacante de empleo
   */
  visitJobApplication(application: JobApplicationElement): void;

  /**
   * Visita un análisis de compatibilidad de CV con filtros ATS
   */
  visitCvAts(cvAnalysis: CvAtsAnalysisElement): void;
}
