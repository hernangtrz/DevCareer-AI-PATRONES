"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_1 = require("../services/ai");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
const codeChallengeService = new ai_1.CodeChallengeService();
// Apply AI rate limiting
router.use(rate_limit_middleware_1.aiRateLimiter);
// POST /code/feedback (or /api/code/feedback)
router.post("/feedback", async (req, res) => {
    try {
        const { code, problemTitle, problemDescription, passedCount, totalCount, isDesignPattern, } = req.body;
        if (!code || !problemTitle) {
            res.status(400).json({
                success: false,
                message: "code y problemTitle son requeridos para la evaluación.",
            });
            return;
        }
        const feedback = await codeChallengeService.evaluate({
            code,
            problemTitle,
            problemDescription: problemDescription || "",
            passedCount: Number(passedCount) || 0,
            totalCount: Number(totalCount) || 0,
            isDesignPattern: Boolean(isDesignPattern),
        });
        res.status(200).json({
            success: true,
            feedback,
        });
    }
    catch (error) {
        console.error("[CodeRoutes] Error en /code/feedback:", error?.message || error);
        res.status(500).json({
            success: false,
            message: error?.message || "Error al evaluar la solución de código.",
        });
    }
});
exports.default = router;
//# sourceMappingURL=code.routes.js.map