import { Router, Response, NextFunction } from "express";
import { requireAuth, flexibleAuth, AuthRequest } from "../middleware/auth.middleware";
import { getFeedbackByInterviewId } from "../services/feedback.service";
import { aiRateLimiter } from "../middleware/rate-limit.middleware";
import { InterviewEvaluationFacade } from "../patterns/facade";
import { getUserJobApplications } from "../services/jobs.service";
import { calculateRealUserAnalytics } from "../services/analytics.service";
import { getInterviewsByUserId } from "../services/interviews.service";
import {
  PerformanceReport,
  InterviewFeedbackReport,
  EnglishProficiencyReport,
  UserDashboardReport,
  resolveReportRenderer,
  SUPPORTED_REPORT_FORMATS,
} from "../patterns/bridge";
import { getDefaultCareerMediator } from "../patterns/mediator";
import {
  CandidatePortfolio,
  InterviewSessionElement,
  CodeChallengeElement,
  JobApplicationElement,
  CvAtsAnalysisElement,
  SeniorityReadinessVisitor,
  BlindspotDetectionVisitor,
  ExecutivePortfolioVisitor,
} from "../patterns/visitor";

const router = Router();
const interviewEvaluationFacade = new InterviewEvaluationFacade();
const careerMediator = getDefaultCareerMediator();

/**
 * Middleware de autenticación flexible:
 * Permite token Bearer, cookie de sesión o fallback a usuario demo para exports del navegador.
 */
// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/user/analytics-summary - Resumen consolidado para Analytics
// ──────────────────────────────────────────────────────────────────────────────
router.get("/user/analytics-summary", flexibleAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f";
    const summary = await calculateRealUserAnalytics(userId);
    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error obteniendo analíticas reales:", error);
    res.status(500).json({ success: false, message: "Error al calcular analíticas reales del usuario" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
router.get("/user/analytics-export", flexibleAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const format = req.query.format as string | undefined;
  const renderer = resolveReportRenderer(format);

  if (!renderer) {
    res.status(400).json({
      success: false,
      message: `Formato no soportado. Usa uno de: ${SUPPORTED_REPORT_FORMATS.join(", ")}`,
    });
    return;
  }

  try {
    const userId = req.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f";
    const summary = await calculateRealUserAnalytics(userId);

    const report = new UserDashboardReport(
      {
        userId,
        userName: req.userName || "Hernán Gutiérrez",
        totalInterviews: summary.metrics.totalInterviews,
        averageScore: summary.readinessScore,
        technicalScore: summary.pillars.find((p) => p.name.includes("Técnic"))?.score || summary.readinessScore,
        communicationScore: summary.pillars.find((p) => p.name.includes("Comunic"))?.score || summary.readinessScore,
        cefrLevel: summary.readinessScore >= 70 ? "B2 - Upper Intermediate" : "B1 - Intermediate",
        topStrengths: [
          "Diseño de arquitectura limpia y principios SOLID",
          "Manejo de TypeScript, React, Go y microservicios",
          "Resolución algorítmica estructurada",
        ],
        keyImprovements: summary.blindspots.map((b) => b.detail).slice(0, 3),
        totalApplications: summary.metrics.totalApplications,
      },
      renderer
    );

    const { content, contentType, filename } = report.export();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(content);
  } catch (error: any) {
    console.error("[FeedbackRoutes] Error exportando analíticas:", error);
    res.status(500).json({ success: false, message: "Error al exportar analíticas" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/mediator/logs - Trazabilidad del Patrón Mediator (GoF)
// ──────────────────────────────────────────────────────────────────────────────
router.get("/mediator/logs", flexibleAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f";
  res.status(200).json({
    success: true,
    logs: careerMediator.getCoordinationLogs(),
    alerts: careerMediator.analyticsColleague.getAlertsForUser(userId),
    milestones: careerMediator.analyticsColleague.getMilestonesForUser(userId),
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/user/portfolio-audit - Patrón Comportamental Visitor (GoF)
// ──────────────────────────────────────────────────────────────────────────────
router.get("/user/portfolio-audit", flexibleAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f";
    const summary = await calculateRealUserAnalytics(userId);
    const applications = await getUserJobApplications(userId);

    // 1. Construir la estructura de elementos heterogéneos (Object Structure)
    const portfolio = new CandidatePortfolio(userId);

    // a. Entrevistas simuladas
    const interviewScore =
      summary.pillars.find((p) => p.name.includes("Técnic"))?.score ||
      summary.readinessScore ||
      85;
    const commScore =
      summary.pillars.find((p) => p.name.includes("Comunic"))?.score || 80;

    portfolio.addElement(
      new InterviewSessionElement({
        id: `int-${Date.now()}-1`,
        role: "Full Stack Engineer",
        company: "GitLab",
        technicalScore: interviewScore,
        communicationScore: commScore,
        cefrLevel: interviewScore >= 75 ? "B2" : "B1",
        techStack: ["TypeScript", "React", "Node.js", "Docker"],
        finalized: true,
      })
    );

    // b. Retos de código y algoritmia
    portfolio.addElement(
      new CodeChallengeElement({
        id: `code-${Date.now()}-1`,
        challengeTitle: "LRU Cache & Concurrency Control",
        language: "TypeScript",
        difficulty: "Medium",
        testsPassed: 10,
        totalTests: 10,
        cyclomaticComplexity: 7,
        executionTimeMs: 42,
        cleanCodeScore: 90,
        passed: true,
      })
    );

    // c. Postulaciones activas
    if (applications && applications.length > 0) {
      applications.slice(0, 3).forEach((app) => {
        portfolio.addElement(
          new JobApplicationElement({
            id: app.id,
            jobTitle: app.jobTitle,
            company: app.company,
            status: app.status,
            matchScore: app.matchScore || 88,
            seniority: "Mid-Level",
            salaryUSD: app.salary || "$7,500 USD",
            platform: app.platform,
            notes: app.notes,
            techStack: app.techstack || ["TypeScript"],
          })
        );
      });
    } else {
      portfolio.addElement(
        new JobApplicationElement({
          id: `app-demo-1`,
          jobTitle: "Senior Backend Engineer",
          company: "GitLab",
          status: "interviewing",
          matchScore: 92,
          seniority: "Senior",
          salaryUSD: "$12,000 USD",
          platform: "Greenhouse",
        })
      );
    }

    // d. Diagnóstico de hoja de vida (ATS)
    portfolio.addElement(
      new CvAtsAnalysisElement({
        id: `ats-${Date.now()}-1`,
        targetRole: "Senior Software Engineer",
        atsScore: 88,
        matchedKeywords: ["TypeScript", "React", "Node.js", "Go", "Docker", "PostgreSQL"],
        missingKeywords: ["Kubernetes", "GraphQL"],
        formattingIssues: [],
        hasClearSenioritySummary: true,
      })
    );

    // 2. Instanciar Visitantes Concretos
    const readinessVisitor = new SeniorityReadinessVisitor();
    const blindspotVisitor = new BlindspotDetectionVisitor();
    const executiveVisitor = new ExecutivePortfolioVisitor();

    // 3. Ejecutar Doble Despacho (Double Dispatch)
    portfolio.accept(readinessVisitor);
    portfolio.accept(blindspotVisitor);
    portfolio.accept(executiveVisitor);

    res.status(200).json({
      success: true,
      pattern: "Visitor (GoF)",
      candidateId: userId,
      visitedElementsCount: portfolio.size,
      seniorityReadiness: readinessVisitor.getReport(),
      blindspots: blindspotVisitor.getReport(),
      executivePortfolio: executiveVisitor.getSummary(),
    });
  } catch (error: any) {
    console.error("[FeedbackRoutes] Error en auditoría con Visitor:", error);
    res.status(500).json({ success: false, message: "Error al auditar portafolio con patrón Visitor" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /feedback - Generar y persistir feedback de entrevista
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  aiRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await interviewEvaluationFacade.processAndSaveEvaluation({
        interviewId: req.body.interviewId,
        userId: req.userId || "anonymous",
        transcript: req.body.transcript,
        language: req.body.language,
      });

      // Patrón Mediator (GoF): Notificar que la evaluación concluyó para sincronizar
      // entrevista (finalized), notas de postulación asociada y alertas de analítica
      try {
        await careerMediator.feedbackColleague.notifyEvaluationCompleted({
          feedbackId: result.feedbackId,
          feedback: result.feedback,
        });
      } catch (mediatorErr) {
        console.warn("[FeedbackRoutes] Aviso en coordinación Mediator:", mediatorErr);
      }

      res.status(201).json({
        success: true,
        feedbackId: result.feedbackId,
        feedback: result.feedback,
      });
    } catch (error: any) {
      console.error("[FeedbackRoutes] Error procesando evaluación:", error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message || "Error al procesar el feedback con la IA",
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/:interviewId - Obtener feedback guardado
// ──────────────────────────────────────────────────────────────────────────────
router.get("/:interviewId", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { interviewId } = req.params;

  try {
    const feedback = await getFeedbackByInterviewId(interviewId, req.userId!);

    if (!feedback) {
      res.status(404).json({ success: false, message: "Feedback no encontrado" });
      return;
    }

    res.status(200).json({ success: true, feedback });
  } catch (error: any) {
    console.error("[FeedbackRoutes] Error obteniendo feedback:", error);
    res.status(500).json({ success: false, message: "Error al obtener el feedback" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /feedback/:interviewId/export - Exportar feedback individual
// ──────────────────────────────────────────────────────────────────────────────
router.get("/:interviewId/export", flexibleAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { interviewId } = req.params;
  const reportType = String(req.query.report || "interview").toLowerCase();
  const renderer = resolveReportRenderer(req.query.format as string | undefined);

  if (!renderer) {
    res.status(400).json({
      success: false,
      message: `Formato no soportado. Usa uno de: ${SUPPORTED_REPORT_FORMATS.join(", ")}`,
    });
    return;
  }

  try {
    const feedback = await getFeedbackByInterviewId(interviewId, req.userId!);

    if (!feedback) {
      res.status(404).json({ success: false, message: "Feedback no encontrado" });
      return;
    }

    let report: PerformanceReport;
    if (reportType === "english") {
      if (!feedback.englishFeedback) {
        res.status(404).json({ success: false, message: "Esta entrevista no tiene evaluación de inglés (CEFR)" });
        return;
      }
      report = new EnglishProficiencyReport(interviewId, feedback.englishFeedback, renderer);
    } else if (reportType === "interview") {
      report = new InterviewFeedbackReport(feedback, renderer);
    } else {
      res.status(400).json({ success: false, message: "Tipo de reporte no soportado. Usa: interview, english" });
      return;
    }

    const { content, contentType, filename } = report.export();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(content);
  } catch (error: any) {
    console.error("[FeedbackRoutes] Error exportando feedback:", error);
    res.status(500).json({ success: false, message: "Error al exportar el feedback" });
  }
});

export default router;
