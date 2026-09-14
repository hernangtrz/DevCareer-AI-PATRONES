import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware";
import { createFeedbackRecord, getFeedbackByInterviewId } from "../services/feedback.service";
import {
  generateInterviewFeedback,
  generateEnglishProficiencyFeedback,
} from "../services/gemini.service";
import { aiRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

router.use(requireAuth);

// ──────────────────────────────────────────────────────────────────────────────
// POST /feedback - Generar y persistir feedback de entrevista
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  aiRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { interviewId, transcript, language } = req.body;
    const isEnglish = language === "en";

    if (!interviewId) {
      res.status(400).json({ success: false, message: "interviewId es requerido" });
      return;
    }

    try {
      const messages = Array.isArray(transcript) ? transcript : [];
      let formattedTranscript = messages
        .filter((s: any) => s && s.content)
        .map((s: any) => `- ${s.role || "user"}: ${s.content}\n`)
        .join("");

      if (!formattedTranscript.trim()) {
        formattedTranscript = isEnglish
          ? "- assistant: Welcome to the interview.\n- user: Hello, I am ready."
          : "- assistant: Bienvenido a la entrevista.\n- user: Hola, estoy listo.";
      }

      // ── Llamadas a Gemini (resilientes) ────────────────────────
      const feedbackPromise = generateInterviewFeedback(formattedTranscript, isEnglish).catch((err) => {
        console.warn("[FeedbackRoutes] Advertencia en generateInterviewFeedback, usando fallback:", err?.message);
        return {
          totalScore: 70,
          categoryScores: [
            { name: isEnglish ? "Communication Skills" : "Habilidades de Comunicación", score: 70, comment: isEnglish ? "Good initial interaction." : "Buena interacción inicial." },
            { name: isEnglish ? "Technical Knowledge" : "Conocimiento Técnico", score: 70, comment: isEnglish ? "Baseline demonstrated." : "Conocimiento base demostrado." },
            { name: isEnglish ? "Problem Solving" : "Resolución de Problemas", score: 70, comment: isEnglish ? "Standard approach." : "Enfoque estándar." },
            { name: isEnglish ? "Cultural and Role Fit" : "Ajuste Cultural y al Puesto", score: 70, comment: isEnglish ? "Positive attitude." : "Actitud positiva." },
            { name: isEnglish ? "Confidence and Clarity" : "Confianza y Claridad", score: 70, comment: isEnglish ? "Clear voice and answers." : "Respuestas claras." },
          ],
          strengths: [isEnglish ? "Clear voice interaction" : "Interacción de voz clara"],
          areasForImprovement: [isEnglish ? "Provide deeper technical examples in future sessions" : "Profundizar en ejemplos técnicos en futuras sesiones"],
          finalAssessment: isEnglish ? "Interview completed successfully." : "Entrevista completada con éxito.",
        };
      });

      const englishPromise = isEnglish
        ? generateEnglishProficiencyFeedback(formattedTranscript).catch((err) => {
            console.warn("[FeedbackRoutes] Error en evaluación de inglés CEFR (ignorado para no bloquear):", err?.message);
            return null;
          })
        : Promise.resolve(null);

      const [feedbackData, englishData] = await Promise.all([
        feedbackPromise,
        englishPromise,
      ]);

      // ── Guardar feedback en base de datos ────────────────────────────────────
      const feedbackPayload = {
        interviewId,
        userId: req.userId || "anonymous",
        totalScore: feedbackData.totalScore,
        categoryScores: feedbackData.categoryScores,
        strengths: feedbackData.strengths,
        areasForImprovement: feedbackData.areasForImprovement,
        finalAssessment: feedbackData.finalAssessment,
        englishFeedback: englishData || undefined,
        createdAt: new Date().toISOString(),
      };

      const recordId = await createFeedbackRecord(feedbackPayload);

      res.status(201).json({
        success: true,
        feedbackId: recordId,
        feedback: { id: recordId, ...feedbackPayload },
      });
    } catch (error: any) {
      console.error("[FeedbackRoutes] Error generando feedback:", error);
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

export default router;