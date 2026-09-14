"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cognito_1 = require("../config/cognito");
const supabase_1 = require("../config/supabase");
const users_service_1 = require("../services/users.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
// Lista de verificadores independientes según el Patrón Strategy (OCP / DIP)
const authVerifiers = [
    new auth_middleware_1.SupabaseAuthVerifier(supabase_1.supabase),
    new auth_middleware_1.CognitoAuthVerifier(cognito_1.cognitoIdVerifier),
];
// ──────────────────────────────────────────────────────────────────────────────
// POST /auth/signup
// ──────────────────────────────────────────────────────────────────────────────
router.post("/signup", rate_limit_middleware_1.authLimiter, async (req, res) => {
    const { uid, name, email } = req.body;
    if (!uid || !name || !email) {
        res.status(400).json({ success: false, message: "Faltan campos: uid, name, email" });
        return;
    }
    try {
        const existing = await (0, users_service_1.getUserById)(uid);
        if (existing) {
            res.status(409).json({
                success: false,
                message: "El usuario ya existe. Por favor inicia sesión.",
            });
            return;
        }
        await (0, users_service_1.createUser)({ id: uid, name, email });
        res.status(201).json({
            success: true,
            message: "Cuenta registrada con éxito.",
        });
    }
    catch (error) {
        console.error("Error en /auth/signup:", error);
        if (error.name === "ConditionalCheckFailedException") {
            res.status(409).json({
                success: false,
                message: "El usuario ya existe. Por favor inicia sesión.",
            });
            return;
        }
        res.status(500).json({ success: false, message: "Error al crear la cuenta" });
    }
});
// ──────────────────────────────────────────────────────────────────────────────
// POST /auth/signin
// ──────────────────────────────────────────────────────────────────────────────
router.post("/signin", rate_limit_middleware_1.authLimiter, async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        res.status(400).json({ success: false, message: "idToken requerido" });
        return;
    }
    try {
        // Verificación polimórfica mediante la interfaz IAuthVerifier
        let authUser = null;
        for (const verifier of authVerifiers) {
            authUser = await verifier.verifyToken(idToken);
            if (authUser)
                break;
        }
        if (!authUser) {
            res.status(401).json({ success: false, message: "Token inválido o proveedor no reconocido." });
            return;
        }
        const uid = authUser.id;
        const email = authUser.email || "";
        const name = authUser.name || email.split("@")[0] || "Usuario";
        // Auto-crear usuario en DB si no existe
        const existing = await (0, users_service_1.getUserById)(uid);
        if (!existing) {
            await (0, users_service_1.createUser)({ id: uid, name, email });
            console.log(`👤 Usuario ${email} auto-creado en la base de datos (/signin)`);
        }
        // Retornar el mismo Token como "sessionCookie" 
        // (el cliente lo guarda como cookie httpOnly via /api/auth/session)
        res.status(200).json({
            success: true,
            sessionCookie: idToken,
            message: "Sesión iniciada correctamente.",
        });
    }
    catch (error) {
        console.error("Error en /auth/signin:", error);
        res.status(401).json({ success: false, message: "Token inválido. Error al iniciar sesión." });
    }
});
// ──────────────────────────────────────────────────────────────────────────────
// GET /auth/me
// Retorna el usuario actual a partir del Bearer token
// ──────────────────────────────────────────────────────────────────────────────
router.get("/me", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        let user = await (0, users_service_1.getUserById)(req.userId);
        if (!user) {
            // Auto-crear usuario si no existe
            user = {
                id: req.userId,
                name: req.userName || req.userEmail?.split("@")[0] || "Usuario",
                email: req.userEmail || "",
            };
            await (0, users_service_1.createUser)(user);
            console.log(`👤 Usuario ${user.email} auto-creado en la base de datos (/me)`);
        }
        res.status(200).json({ success: true, user });
    }
    catch (error) {
        console.error("Error en /auth/me:", error);
        res.status(500).json({ success: false, message: "Error al obtener el usuario" });
    }
});
// ──────────────────────────────────────────────────────────────────────────────
// POST /auth/verify-session
// Verifica el token guardado como sessionCookie y retorna el usuario.
// ──────────────────────────────────────────────────────────────────────────────
router.post("/verify-session", async (req, res) => {
    const { sessionCookie } = req.body;
    if (!sessionCookie) {
        res.status(400).json({ success: false, message: "sessionCookie requerido" });
        return;
    }
    try {
        let authUser = null;
        for (const verifier of authVerifiers) {
            authUser = await verifier.verifyToken(sessionCookie);
            if (authUser)
                break;
        }
        if (!authUser) {
            res.status(401).json({ success: false, message: "Sesión inválida o expirada" });
            return;
        }
        const uid = authUser.id;
        const email = authUser.email || "";
        const name = authUser.name || email.split("@")[0] || "Usuario";
        let user = await (0, users_service_1.getUserById)(uid);
        if (!user) {
            user = { id: uid, name, email };
            await (0, users_service_1.createUser)(user);
            console.log(`👤 Usuario ${email} auto-creado en la base de datos (/verify-session)`);
        }
        res.status(200).json({ success: true, user });
    }
    catch (error) {
        console.error("Error en /auth/verify-session:", error);
        res.status(401).json({ success: false, message: "Sesión inválida o expirada" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map