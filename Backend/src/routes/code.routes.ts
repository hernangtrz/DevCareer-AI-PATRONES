import { Router, Response } from "express";
import { AIServiceFacade } from "../patterns/facade";
import { getDefaultCareerMediator } from "../patterns/mediator";
import { aiRateLimiter } from "../middleware/rate-limit.middleware";
import { flexibleAuth, AuthRequest } from "../middleware/auth.middleware";

const router = Router();
const aiFacade = new AIServiceFacade();
const careerMediator = getDefaultCareerMediator();

// Apply AI rate limiting
router.use(aiRateLimiter);

// POST /code/feedback (or /api/code/feedback)
// Patrón Estructural Facade (GoF) + Patrón Comportamental Mediator (GoF)
router.post("/feedback", flexibleAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      problemTitle,
      problemDescription,
      passedCount,
      totalCount,
      isDesignPattern,
    } = req.body;

    if (!code || !problemTitle) {
      res.status(400).json({
        success: false,
        message: "code y problemTitle son requeridos para la evaluación.",
      });
      return;
    }

    const feedback = await aiFacade.evaluateCodeChallenge({
      code,
      problemTitle,
      problemDescription: problemDescription || "",
      passedCount: Number(passedCount) || 0,
      totalCount: Number(totalCount) || 0,
      isDesignPattern: Boolean(isDesignPattern),
    });

    // Patrón Mediator (GoF): Si hay puntaje bajo (< 75), fallaron pruebas o no se aplicó
    // el patrón/SOLID esperado, emitir SKILL_GAP_DETECTED para crear refuerzo y alerta.
    const patternMissing =
      Boolean(isDesignPattern) && feedback.patternAnalysis?.isPatternApplied === false;
    const testsFailed = Number(totalCount) > 0 && Number(passedCount) < Number(totalCount);
    const hasSkillGaps = Number(feedback.score) < 75 || patternMissing || testsFailed;
    let refresherInterviewId: string | null = null;

    if (hasSkillGaps) {
      try {
        const missingSkills: string[] = [];
        if (patternMissing) {
          missingSkills.push("Patrones de Diseño GoF y Principios SOLID");
        }
        if (testsFailed) {
          missingSkills.push(`Resolución Algorítmica (${problemTitle})`);
        }
        if (Array.isArray(feedback.improvements)) {
          for (const imp of feedback.improvements.slice(0, 2)) {
            if (typeof imp === "string" && imp.trim()) {
              missingSkills.push(imp.trim().slice(0, 60));
            }
          }
        }
        if (missingSkills.length === 0) {
          missingSkills.push("Complejidad Big-O y Clean Code");
        }

        await careerMediator.feedbackColleague.notifySkillGapDetected({
          userId: req.userId || req.body.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
          source: "code-challenge",
          targetRole: problemTitle,
          missingSkills: missingSkills.slice(0, 4),
          score: Number(feedback.score) || 0,
        });
        refresherInterviewId = careerMediator.getLastPreparedInterviewId();
      } catch (mediatorErr) {
        console.warn("[CodeRoutes] Aviso en coordinación Mediator (/code/feedback):", mediatorErr);
      }
    }

    res.status(200).json({
      success: true,
      feedback,
      ...(refresherInterviewId ? { refresherInterviewId } : {}),
    });
  } catch (error: any) {
    console.error("[CodeRoutes] Error en /code/feedback:", error?.message || error);
    res.status(500).json({
      success: false,
      message: error?.message || "Error al evaluar la solución de código.",
    });
  }
});

export default router;
