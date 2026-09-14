"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const ai_1 = require("../services/ai");
const cv_optimization_service_1 = require("../services/cv-optimization.service");
const router = (0, express_1.Router)();
const cvAnalysisService = new ai_1.CvAnalysisService();
const cvOptimizationService = new cv_optimization_service_1.CvOptimizationService();
// Configure multer for in-memory PDF uploads (max 8MB)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
});
// Apply rate limiting to all AI CV endpoints
router.use(rate_limit_middleware_1.aiRateLimiter);
// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cv/analyze
// Soporta tanto subida de archivo PDF (multipart/form-data) como texto pegado (JSON)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/analyze", upload.single("cvFile"), async (req, res) => {
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
        const analysis = await cvAnalysisService.analyze({
            jobDescription,
            cvText: !pdfBase64 ? cvText : undefined,
            pdfBase64,
        });
        res.status(200).json({
            success: true,
            data: analysis,
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
// POST /api/cv/improve - Optimizar hoja de vida (CC-06 Refactorizado)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/improve", async (req, res) => {
    try {
        const improvedData = await cvOptimizationService.improveCv(req.body);
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
// POST /api/cv/improve-profile - Optimizar resumen ejecutivo del perfil (CC-06 Refactorizado)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/improve-profile", async (req, res) => {
    try {
        const result = await cvOptimizationService.improveProfile(req.body);
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