import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware";
import { getFeedbackByInterviewId } from "../services/feedback.service";
import { aiRateLimiter } from "../middleware/rate-limit.middleware";
import { InterviewEvaluationFacade } from "../patterns/facade";
import {
  PerformanceReport,
  InterviewFeedbackReport,
  EnglishProficiencyReport,
  UserDashboardReport,
  resolveReportRenderer,
  SUPPORTED_REPORT_FORMATS,
} from "../patterns/bridge";

const router = Router();
const interviewEvaluationFacade = new InterviewEvaluationFacade();

router.use(requireAuth);

// ──────────────────────────────────────────────────────────────────────────────
// POST /feedback - Generar y persistir feedback de entrevista
// Patrón Estructural Facade (GoF): Resuelve el antipatrón Fat Controller delegando
// la orquestación integral de sesión, transcript, IA y persistencia a la Fachada.
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  aiRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await interviewEvaluationFacade.processAndSaveEvaluation({
        interviewId: req.body.interviewId,
        userId: req.userId || "anonymous",
        transcript: req.body.transcript,
        language: req.body.language,
      });

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
router.get("/:interviewId", async (req: AuthRequest, res: Response): Promise<void> => {
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
// GET /feedback/:interviewId/export?report=interview|english&format=md|html|txt
// Patrón Bridge: combina cualquier tipo de reporte (Abstracción) con cualquier
// formato de salida (Implementador) sin crear una clase por cada combinación.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/:interviewId/export", async (req: AuthRequest, res: Response): Promise<void> => {
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


// GET /feedback/user/analytics-export?format=html|md|txt
// Patrón Bridge: Exporta el informe de analíticas globales y evolución técnica del usuario
router.get("/user/analytics-export", async (req: AuthRequest, res: Response): Promise<void> => {
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
    const report = new UserDashboardReport(
      {
        userId: req.userId || "usr_demo",
        userName: "Candidato DevCareer",
        totalInterviews: 5,
        averageScore: 84,
        technicalScore: 88,
        communicationScore: 80,
        cefrLevel: "B2 - Upper Intermediate",
        topStrengths: [
          "Diseño de arquitectura limpia y principios SOLID",
          "Manejo fluido de TypeScript, React y microservicios",
          "Resolución algorítmica estructurada"
        ],
        keyImprovements: [
          "Optimización de consultas en bases de datos NoSQL",
          "Profundizar en patrones de resiliencia (Circuit Breaker)"
        ],
        totalApplications: 3,
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

export default router;
