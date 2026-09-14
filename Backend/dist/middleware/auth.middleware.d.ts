import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
export interface AuthUser {
    id: string;
    email?: string;
    name?: string;
}
/**
 * Principio de Inversión de Dependencias y Abierto/Cerrado (DIP / OCP / ISP):
 * Interfaz común para verificadores de autenticación independientes.
 */
export interface IAuthVerifier {
    verifyToken(token: string): Promise<AuthUser | null>;
}
export type AuthStrategy = IAuthVerifier;
export interface AuthRequest extends Request<ParamsDictionary, any, any, ParsedQs> {
    userId?: string;
    userEmail?: string;
    userName?: string;
}
/**
 * Verificador independiente de autenticación para Supabase.
 */
export declare class SupabaseAuthVerifier implements IAuthVerifier {
    private supabase;
    constructor(supabaseClient?: any);
    verifyToken(token: string): Promise<AuthUser | null>;
}
export declare const SupabaseAuthStrategy: typeof SupabaseAuthVerifier;
/**
 * Verificador independiente de autenticación para AWS Cognito.
 */
export declare class CognitoAuthVerifier implements IAuthVerifier {
    private verifier;
    constructor(cognitoVerifier?: any);
    verifyToken(token: string): Promise<AuthUser | null>;
}
export declare const CognitoAuthStrategy: typeof CognitoAuthVerifier;
export declare function requireAuth(reqOrVerifiers?: AuthRequest | IAuthVerifier[], res?: Response, next?: NextFunction): any;
