import { Router, Request, Response } from "express";
import multer from "multer";
import { aiRateLimiter } from "../middleware/rate-limit.middleware";
import { flexibleAuth, AuthRequest } from "../middleware/auth.middleware";
import { AIServiceFacade } from "../patterns/facade";
import { getDefaultCareerMediator } from "../patterns/mediator";

const router = Router();
const aiFacade = new AIServiceFacade();
const careerMediator = getDefaultCareerMediator();

// Configure multer for in-memory PDF uploads (max 8MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// Apply rate limiting to all AI CV endpoints
router.use(aiRateLimiter);

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cv/analyze (Patrón Facade + Patrón Mediator)
// Soporta tanto subida de archivo PDF (multipart/form-data) como texto pegado (JSON)
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/analyze",
  flexibleAuth,
  upload.single("cvFile"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const jobDescription = req.body.jobDescription || "";
      const cvText = req.body.cvText || "";
      const file = req.file;

      if (!jobDescription || jobDescription.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "La descripción de la oferta de empleo es obligatoria.",
        });
        return;
      }

      if (!file && (!cvText || cvText.trim().length === 0)) {
        res.status(400).json({
          success: false,
          message: "Debes adjuntar un archivo PDF o ingresar el texto de tu currículum.",
        });
        return;
      }

      let pdfBase64: string | undefined = undefined;
      if (file && file.mimetype === "application/pdf") {
        pdfBase64 = file.buffer.toString("base64");
      }

      const analysis = await aiFacade.analyzeCvAts({
        jobDescription,
        cvText: !pdfBase64 ? cvText : undefined,
        pdfBase64,
      });

      // Patrón Mediator (GoF): Si hay brechas de keywords o compatibilidad baja (< 75),
      // notificar SKILL_GAP_DETECTED para preparar entrevista de refuerzo y alerta en analítica.
      const missingKeywords = Array.isArray(analysis.missingKeywords)
        ? analysis.missingKeywords.filter((k) => typeof k === "string" && k.trim().length > 0)
        : [];
      const hasSkillGaps = Number(analysis.score) < 75 || missingKeywords.length > 0;
      let refresherInterviewId: string | null = null;

      if (hasSkillGaps) {
        try {
          const targetRole =
            (req.body.targetRole as string)?.trim() ||
            jobDescription.split("\n")[0].slice(0, 60).trim() ||
            "Software Developer";

          await careerMediator.feedbackColleague.notifySkillGapDetected({
            userId: req.userId || req.body.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
            source: "cv-ats",
            targetRole,
            missingSkills:
              missingKeywords.length > 0 ? missingKeywords.slice(0, 5) : ["Optimización ATS"],
            score: Number(analysis.score) || 0,
          });
          refresherInterviewId = careerMediator.getLastPreparedInterviewId();
        } catch (mediatorErr) {
          console.warn("[CvRoutes] Aviso en coordinación Mediator (analyze):", mediatorErr);
        }
      }

      res.status(200).json({
        success: true,
        data: analysis,
        ...(refresherInterviewId ? { refresherInterviewId } : {}),
      });
    } catch (error: any) {
      console.error("[CvRoutes] Error en /api/cv/analyze:", error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message || "Ocurrió un error al analizar el CV con la IA.",
      });
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cv/improve - Optimizar hoja de vida (Patrón Facade: consume aiFacade.optimizeCv)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/improve", async (req: Request, res: Response): Promise<void> => {
  try {
    const improvedData = await aiFacade.optimizeCv(req.body);

    res.status(200).json({
      success: true,
      data: improvedData,
    });
  } catch (error: any) {
    console.error("[CvRoutes] Error optimizando CV:", error?.message || error);
    res.status(500).json({
      success: false,
      message: error?.message || "Ocurrió un error al procesar la optimización del CV.",
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cv/improve-profile - Optimizar perfil (Patrón Facade: consume aiFacade.optimizeProfile)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/improve-profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await aiFacade.optimizeProfile(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[CvRoutes] Error optimizando perfil:", error?.message || error);
    res.status(500).json({
      success: false,
      message: error?.message || "Ocurrió un error al procesar la optimización del perfil.",
    });
  }
});

export default router;
