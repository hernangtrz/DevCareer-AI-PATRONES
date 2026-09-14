import { Router, Request, Response } from "express";
import multer from "multer";
import { aiRateLimiter } from "../middleware/rate-limit.middleware";
import { CvAnalysisService } from "../services/ai";
import { CvOptimizationService } from "../services/cv-optimization.service";

const router = Router();
const cvAnalysisService = new CvAnalysisService();
const cvOptimizationService = new CvOptimizationService();

// Configure multer for in-memory PDF uploads (max 8MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// Apply rate limiting to all AI CV endpoints
router.use(aiRateLimiter);

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cv/analyze
// Soporta tanto subida de archivo PDF (multipart/form-data) como texto pegado (JSON)
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/analyze",
  upload.single("cvFile"),
  async (req: Request, res: Response): Promise<void> => {
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

      const analysis = await cvAnalysisService.analyze({
        jobDescription,
        cvText: !pdfBase64 ? cvText : undefined,
        pdfBase64,
      });

      res.status(200).json({
        success: true,
        data: analysis,
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
// POST /api/cv/improve - Optimizar hoja de vida (CC-06 Refactorizado)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/improve", async (req: Request, res: Response): Promise<void> => {
  try {
    const improvedData = await cvOptimizationService.improveCv(req.body);

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
// POST /api/cv/improve-profile - Optimizar resumen ejecutivo del perfil (CC-06 Refactorizado)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/improve-profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await cvOptimizationService.improveProfile(req.body);

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
