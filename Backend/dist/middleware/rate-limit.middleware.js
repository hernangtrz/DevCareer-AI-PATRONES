"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.aiRateLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Helper para detectar si la petición proviene del mismo servidor/localhost
 * (ej: llamadas internas Server-to-Server de Next.js SSR).
 */
function isInternalOrDev(req) {
    if (process.env.NODE_ENV !== "production")
        return true;
    const ip = req.ip || req.socket.remoteAddress || "";
    return (ip === "127.0.0.1" ||
        ip === "::1" ||
        ip === "::ffff:127.0.0.1" ||
        ip.startsWith("10.") ||
        ip.startsWith("172.") ||
        ip.startsWith("192.168."));
}
// ── General API Rate Limiter (Protección DDoS en producción) ─────────────────
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Holgado para no bloquear navegación
    standardHeaders: true,
    legacyHeaders: false,
    skip: isInternalOrDev,
    message: {
        success: false,
        message: "Demasiadas solicitudes. Por favor intenta de nuevo en unos minutos.",
    },
});
// ── Strict AI Operations Rate Limiter (Protege cuotas de Gemini/Groq) ─────────
// Solo limita llamadas repetitivas de IA por cliente
exports.aiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 60, // Permite pruebas fluidas y uso normal
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Límite de solicitudes de IA excedido temporalmente. Espera un minuto antes de reintentar.",
    },
});
// ── Auth Brute-Force Rate Limiter (Solo para Login y Register) ────────────────
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 30, // 30 intentos por 5 minutos
    standardHeaders: true,
    legacyHeaders: false,
    skip: isInternalOrDev,
    message: {
        success: false,
        message: "Demasiados intentos de inicio de sesión. Por favor espera un momento.",
    },
});
//# sourceMappingURL=rate-limit.middleware.js.map