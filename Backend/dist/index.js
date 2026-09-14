"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const rate_limit_middleware_1 = require("./middleware/rate-limit.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const interviews_routes_1 = __importDefault(require("./routes/interviews.routes"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
const livekit_routes_1 = __importDefault(require("./routes/livekit.routes"));
const cv_routes_1 = __importDefault(require("./routes/cv.routes"));
const code_routes_1 = __importDefault(require("./routes/code.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// ── Trust Proxy (para Rate Limiting preciso detrás de ALB/Vercel) ──────────────
app.set("trust proxy", 1);
// ── Middlewares Globales ───────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting general (solo activo en producción para tráfico externo)
app.use(rate_limit_middleware_1.generalLimiter);
// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
// ── Rutas de la Aplicación ────────────────────────────────────────────────────
app.use("/auth", auth_routes_1.default);
app.use("/interviews", interviews_routes_1.default);
app.use("/feedback", feedback_routes_1.default);
app.use("/api/livekit", livekit_routes_1.default);
app.use("/api/cv", cv_routes_1.default);
app.use("/cv", cv_routes_1.default); // Alias unificado
app.use("/code", code_routes_1.default);
app.use("/api/code", code_routes_1.default); // Alias unificado
// ── Manejo de rutas no encontradas ─────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Ruta no encontrada" });
});
// ── Manejo global de errores ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("[Backend] Error no manejado:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
});
// ── Iniciar servidor ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Backend DevCareer corriendo en http://localhost:${PORT}`);
    console.log(`   Entorno: ${process.env.NODE_ENV || "development"}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map