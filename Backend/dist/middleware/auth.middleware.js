"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoAuthStrategy = exports.CognitoAuthVerifier = exports.SupabaseAuthStrategy = exports.SupabaseAuthVerifier = void 0;
exports.requireAuth = requireAuth;
const cognito_1 = require("../config/cognito");
const supabase_1 = require("../config/supabase");
/**
 * Verificador independiente de autenticación para Supabase.
 */
class SupabaseAuthVerifier {
    constructor(supabaseClient = supabase_1.supabase) {
        this.supabase = supabaseClient;
    }
    async verifyToken(token) {
        if (!process.env.SUPABASE_URL)
            return null;
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser(token);
            if (user && !error) {
                return {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0],
                };
            }
            return null;
        }
        catch {
            return null;
        }
    }
}
exports.SupabaseAuthVerifier = SupabaseAuthVerifier;
// Alias para retrocompatibilidad
exports.SupabaseAuthStrategy = SupabaseAuthVerifier;
/**
 * Verificador independiente de autenticación para AWS Cognito.
 */
class CognitoAuthVerifier {
    constructor(cognitoVerifier = cognito_1.cognitoIdVerifier) {
        this.verifier = cognitoVerifier;
    }
    async verifyToken(token) {
        try {
            if (!this.verifier)
                return null;
            const payload = await this.verifier.verify(token);
            return {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
            };
        }
        catch {
            return null;
        }
    }
}
exports.CognitoAuthVerifier = CognitoAuthVerifier;
// Alias para retrocompatibilidad
exports.CognitoAuthStrategy = CognitoAuthVerifier;
async function executeAuth(req, res, next, verifiers) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Token no proporcionado" });
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    for (const verifier of verifiers) {
        const user = await verifier.verifyToken(token);
        if (user) {
            req.userId = user.id;
            req.userEmail = user.email;
            req.userName = user.name;
            return next();
        }
    }
    res.status(401).json({ success: false, message: "Token inválido o expirado" });
}
function requireAuth(reqOrVerifiers, res, next) {
    // Caso 1: Se usa como fábrica con verificadores personalizados: requireAuth(verifiers)
    if (Array.isArray(reqOrVerifiers)) {
        const customVerifiers = reqOrVerifiers;
        return async (req, res, next) => {
            return executeAuth(req, res, next, customVerifiers);
        };
    }
    const defaultVerifiers = [
        new SupabaseAuthVerifier(supabase_1.supabase),
        new CognitoAuthVerifier(cognito_1.cognitoIdVerifier),
    ];
    // Caso 2: si Express lo invoca directamente como middleware: router.use(requireAuth) o router.get("/me", requireAuth), etc
    if (reqOrVerifiers && res && next) {
        return executeAuth(reqOrVerifiers, res, next, defaultVerifiers);
    }
    // Caso 3: Se invoca como función sin argumentos: requireAuth()
    return async (req, res, next) => {
        return executeAuth(req, res, next, defaultVerifiers);
    };
}
//# sourceMappingURL=auth.middleware.js.map