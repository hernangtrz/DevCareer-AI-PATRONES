import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { cognitoIdVerifier } from "../config/cognito";
import { supabase } from "../config/supabase";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Patrón Strategy (OCP / DIP / ISP):
 * Interfaz común para verificadores de autenticación independientes.
 */
export interface IAuthVerifier {
  verifyToken(token: string): Promise<AuthUser | null>;
}

// Alias para retrocompatibilidad
export type AuthStrategy = IAuthVerifier;

export interface AuthRequest extends Request<ParamsDictionary, any, any, ParsedQs> {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Verificador independiente de autenticación para Supabase.
 */
export class SupabaseAuthVerifier implements IAuthVerifier {
  private supabase: any;

  constructor(supabaseClient: any = supabase) {
    this.supabase = supabaseClient;
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    if (!process.env.SUPABASE_URL) return null;
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
    } catch {
      return null;
    }
  }
}

// Alias para retrocompatibilidad
export const SupabaseAuthStrategy = SupabaseAuthVerifier;

/**
 * Verificador independiente de autenticación para AWS Cognito.
 */
export class CognitoAuthVerifier implements IAuthVerifier {
  private verifier: any;

  constructor(cognitoVerifier: any = cognitoIdVerifier) {
    this.verifier = cognitoVerifier;
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      if (!this.verifier) return null;
      const payload = await this.verifier.verify(token);
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch {
      return null;
    }
  }
}

// Alias para retrocompatibilidad
export const CognitoAuthStrategy = CognitoAuthVerifier;

async function executeAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  verifiers: IAuthVerifier[]
): Promise<void> {
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

export function requireAuth(
  reqOrVerifiers?: AuthRequest | IAuthVerifier[],
  res?: Response,
  next?: NextFunction
): any {
  // Caso 1: Se usa como fábrica con verificadores personalizados: requireAuth(verifiers)
  if (Array.isArray(reqOrVerifiers)) {
    const customVerifiers = reqOrVerifiers;
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      return executeAuth(req, res, next, customVerifiers);
    };
  }

  const defaultVerifiers: IAuthVerifier[] = [
    new SupabaseAuthVerifier(supabase),
    new CognitoAuthVerifier(cognitoIdVerifier),
  ];

  // Caso 2: Express lo invoca directamente como middleware: router.use(requireAuth) o router.get("/me", requireAuth, ...)
  if (reqOrVerifiers && res && next) {
    return executeAuth(reqOrVerifiers as AuthRequest, res, next, defaultVerifiers);
  }

  // Caso 3: Se invoca como función sin argumentos: requireAuth()
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    return executeAuth(req, res, next, defaultVerifiers);
  };
}
