"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const facade_1 = require("../patterns/facade");
const mediator_1 = require("../patterns/mediator");
const router = (0, express_1.Router)();
const aiFacade = new facade_1.AIServiceFacade();
const careerMediator = (0, mediator_1.getDefaultCareerMediator)();
// Configure multer for in-memory PDF uploads (max 8MB)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
});
// Apply rate limiting to all AI CV endpoints
router.use(rate_limit_middleware_1.aiRateLimiter);
// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cv/analyze (Patrón Facade + Patrón Mediator)
// Soporta tanto subida de archivo PDF (multipart/form-data) como texto pegado (JSON)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/analyze", auth_middleware_1.flexibleAuth, upload.single("cvFile"), async (req, res) => {
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
        let pdfBase64 = undefined;
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
        let refresherInterviewId = null;
        if (hasSkillGaps) {
            try {
                const targetRole = req.body.targetRole?.trim() ||
                    jobDescription.split("\n")[0].slice(0, 60).trim() ||
                    "Software Developer";
                await careerMediator.feedbackColleague.notifySkillGapDetected({
                    userId: req.userId || req.body.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
                    source: "cv-ats",
                    targetRole,
                    missingSkills: missingKeywords.length > 0 ? missingKeywords.slice(0, 5) : ["Optimización ATS"],
                    score: Number(analysis.score) || 0,
                });
                refresherInterviewId = careerMediator.getLastPreparedInterviewId();
            }
            catch (mediatorErr) {
                console.warn("[CvRoutes] Aviso en coordinación Mediator (analyze):", mediatorErr);
            }
        }
        res.status(200).json({
            success: true,
            data: analysis,
            ...(refresherInterviewId ? { refresherInterviewId } : {}),
        });
    }
    catch (error) {
        console.error("[CvRoutes] Error en /api/cv/analyze:", error?.message || error);
        res.status(500).json({
            success: false,
            message: error?.message || "Ocurrió un error al analizar el CV con la IA.",
        });
    }
});
// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cv/improve - Optimizar hoja de vida (Patrón Facade: consume aiFacade.optimizeCv)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/improve", async (req, res) => {
    try {
        const improvedData = await aiFacade.optimizeCv(req.body);
        res.status(200).json({
            success: true,
            data: improvedData,
        });
    }
    catch (error) {
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
router.post("/improve-profile", async (req, res) => {
    try {
        const result = await aiFacade.optimizeProfile(req.body);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("[CvRoutes] Error optimizando perfil:", error?.message || error);
        res.status(500).json({
            success: false,
            message: error?.message || "Ocurrió un error al procesar la optimización del perfil.",
        });
    }
});
exports.default = router;
//# sourceMappingURL=cv.routes.js.map