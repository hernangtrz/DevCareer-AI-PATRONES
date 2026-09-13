import { Router, Request, Response } from "express";
import { cognitoIdVerifier } from "../config/cognito";
import { supabase } from "../config/supabase";
import { getUserById, createUser } from "../services/users.service";
import {
  requireAuth,
  AuthRequest,
  IAuthVerifier,
  AuthUser,
  SupabaseAuthVerifier,
  CognitoAuthVerifier,
} from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// Lista de verificadores independientes según el Patrón Strategy (OCP / DIP)
const authVerifiers: IAuthVerifier[] = [
  new SupabaseAuthVerifier(supabase),
  new CognitoAuthVerifier(cognitoIdVerifier),
];

// ──────────────────────────────────────────────────────────────────────────────
// POST /auth/signup
// ──────────────────────────────────────────────────────────────────────────────
router.post("/signup", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { uid, name, email } = req.body;

  if (!uid || !name || !email) {
    res.status(400).json({ success: false, message: "Faltan campos: uid, name, email" });
    return;
  }

  try {
    const existing = await getUserById(uid);

    if (existing) {
      res.status(409).json({
        success: false,
        message: "El usuario ya existe. Por favor inicia sesión.",
      });
      return;
    }

    await createUser({ id: uid, name, email });

    res.status(201).json({
      success: true,
      message: "Cuenta registrada con éxito.",
    });
  } catch (error: any) {
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
router.post("/signin", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ success: false, message: "idToken requerido" });
    return;
  }

  try {
    // Verificación polimórfica mediante la interfaz IAuthVerifier (Patrón Strategy)
    let authUser: AuthUser | null = null;
    for (const verifier of authVerifiers) {
      authUser = await verifier.verifyToken(idToken);
      if (authUser) break;
    }

    if (!authUser) {
      res.status(401).json({ success: false, message: "Token inválido o proveedor no reconocido." });
      return;
    }

    const uid = authUser.id;
    const email = authUser.email || "";
    const name = authUser.name || email.split("@")[0] || "Usuario";

    // Auto-crear usuario en DB si no existe
    const existing = await getUserById(uid);
    if (!existing) {
      await createUser({ id: uid, name, email });
      console.log(`👤 Usuario ${email} auto-creado en la base de datos (/signin)`);
    }

    // Retornar el mismo Token como "sessionCookie" 
    // (el cliente lo guarda como cookie httpOnly via /api/auth/session)
    res.status(200).json({
      success: true,
      sessionCookie: idToken,
      message: "Sesión iniciada correctamente.",
    });
  } catch (error) {
    console.error("Error en /auth/signin:", error);
    res.status(401).json({ success: false, message: "Token inválido. Error al iniciar sesión." });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /auth/me
// Retorna el usuario actual a partir del Bearer token
// ──────────────────────────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let user = await getUserById(req.userId!);

    if (!user) {
      // Auto-crear usuario si no existe
      user = {
        id:    req.userId!,
        name:  req.userName || req.userEmail?.split("@")[0] || "Usuario",
        email: req.userEmail || "",
      };
      await createUser(user);
      console.log(`👤 Usuario ${user.email} auto-creado en la base de datos (/me)`);
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error en /auth/me:", error);
    res.status(500).json({ success: false, message: "Error al obtener el usuario" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /auth/verify-session
// Verifica el token guardado como sessionCookie y retorna el usuario.
// ──────────────────────────────────────────────────────────────────────────────
router.post("/verify-session", async (req: Request, res: Response): Promise<void> => {
  const { sessionCookie } = req.body;

  if (!sessionCookie) {
    res.status(400).json({ success: false, message: "sessionCookie requerido" });
    return;
  }

  try {
    let authUser: AuthUser | null = null;
    for (const verifier of authVerifiers) {
      authUser = await verifier.verifyToken(sessionCookie);
      if (authUser) break;
    }

    if (!authUser) {
      res.status(401).json({ success: false, message: "Sesión inválida o expirada" });
      return;
    }

    const uid = authUser.id;
    const email = authUser.email || "";
    const name = authUser.name || email.split("@")[0] || "Usuario";

    let user = await getUserById(uid);

    if (!user) {
      user = { id: uid, name, email };
      await createUser(user);
      console.log(`👤 Usuario ${email} auto-creado en la base de datos (/verify-session)`);
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error en /auth/verify-session:", error);
    res.status(401).json({ success: false, message: "Sesión inválida o expirada" });
  }
});

export default router;
