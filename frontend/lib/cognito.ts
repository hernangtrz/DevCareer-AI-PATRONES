/**
 * lib/cognito.ts
 *
 * Cliente de autenticación híbrido. Soporta AWS Cognito y Supabase Auth,
 * con renovación automática de tokens expirados y sincronización de cookie de sesión.
 */

import { supabase } from "./supabase";

const REGION       = process.env.NEXT_PUBLIC_AWS_REGION       || "us-east-1";
const CLIENT_ID    = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

const COGNITO_URL = `https://cognito-idp.${REGION}.amazonaws.com/`;

let lastSyncedCookieToken = "";
let refreshInFlight: Promise<string> | null = null;

async function cognitoRequest(target: string, body: object) {
  const res = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.__type || "Error de Cognito");
  }

  return data;
}

/**
 * Comprueba si un JWT ya expiró o expirará dentro de `bufferSeconds` segundos.
 */
export function isJwtExpiringSoon(token: string, bufferSeconds = 120): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSeconds + bufferSeconds;
  } catch {
    return false;
  }
}

/**
 * Sincroniza el token actualizado tanto en localStorage (Client Components)
 * como en la cookie httpOnly `session` (Server Components y proxy API).
 */
export async function syncBrowserAuthToken(token: string): Promise<void> {
  if (typeof window === "undefined" || !token) return;

  try {
    localStorage.setItem("cognitoIdToken", token);
  } catch {
    // ignore storage quota/privacy errors
  }

  if (lastSyncedCookieToken === token) return;
  lastSyncedCookieToken = token;

  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionCookie: token }),
    });
  } catch {
    lastSyncedCookieToken = "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN UP — Registrar nuevo usuario
// ─────────────────────────────────────────────────────────────────────────────
export async function signUpCognito(
  email: string,
  password: string,
  name: string
): Promise<{ userSub: string; session?: { access_token: string } | null }> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Error al registrar el usuario en Supabase");

    return { userSub: data.user.id, session: data.session };
  }

  const data = await cognitoRequest("SignUp", {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name",  Value: name },
    ],
  });

  return { userSub: data.UserSub };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM SIGN UP — Confirmar código de verificación enviado al email
// ─────────────────────────────────────────────────────────────────────────────
export async function confirmSignUpCognito(
  email: string,
  code: string
): Promise<void> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (error) throw new Error(error.message);
    return;
  }

  await cognitoRequest("ConfirmSignUp", {
    ClientId:         CLIENT_ID,
    Username:         email,
    ConfirmationCode: code,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN IN — Iniciar sesión y obtener tokens
// ─────────────────────────────────────────────────────────────────────────────
export async function signInCognito(
  email: string,
  password: string
): Promise<{ idToken: string; accessToken: string; refreshToken: string }> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Error al obtener la sesión de Supabase");

    return {
      idToken:      data.session.access_token,
      accessToken:  data.session.access_token,
      refreshToken: data.session.refresh_token || "",
    };
  }

  const data = await cognitoRequest("InitiateAuth", {
    ClientId:  CLIENT_ID,
    AuthFlow:  "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const result = data.AuthenticationResult;

  return {
    idToken:      result.IdToken,
    accessToken:  result.AccessToken,
    refreshToken: result.RefreshToken,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN OUT — Limpiar sesión local
// ─────────────────────────────────────────────────────────────────────────────
export async function signOutCognito(): Promise<void> {
  lastSyncedCookieToken = "";
  if (typeof window !== "undefined") {
    localStorage.removeItem("cognitoIdToken");
    localStorage.removeItem("cognitoAccessToken");
    localStorage.removeItem("cognitoRefreshToken");
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await supabase.auth.signOut();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT ID TOKEN — Leer desde localStorage (síncrono)
// ─────────────────────────────────────────────────────────────────────────────
export function getCognitoIdToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("cognitoIdToken") ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// GET FRESH AUTH TOKEN — Renueva automáticamente si el JWT expiró o está por vencer
// ─────────────────────────────────────────────────────────────────────────────
async function resolveFreshAuthToken(forceRefresh: boolean): Promise<string> {
  if (typeof window === "undefined") return "";

  const storedToken = localStorage.getItem("cognitoIdToken") ?? "";

  // 1. Modo Supabase Auth
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      if (
        !forceRefresh &&
        currentSession?.access_token &&
        !isJwtExpiringSoon(currentSession.access_token)
      ) {
        if (currentSession.access_token !== storedToken) {
          await syncBrowserAuthToken(currentSession.access_token);
        }
        return currentSession.access_token;
      }

      // Intentar renovar con el refresh_token almacenado por Supabase
      if (currentSession?.refresh_token || forceRefresh) {
        const { data: refreshed, error } = await supabase.auth.refreshSession();
        if (!error && refreshed.session?.access_token) {
          await syncBrowserAuthToken(refreshed.session.access_token);
          return refreshed.session.access_token;
        }
      }
    } catch {
      // Continuar al fallback controlado
    }
  }

  // 2. Modo AWS Cognito con RefreshToken
  const storedRefreshToken = localStorage.getItem("cognitoRefreshToken") ?? "";
  if (
    CLIENT_ID &&
    storedRefreshToken &&
    (forceRefresh || !storedToken || isJwtExpiringSoon(storedToken))
  ) {
    try {
      const data = await cognitoRequest("InitiateAuth", {
        ClientId: CLIENT_ID,
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: {
          REFRESH_TOKEN: storedRefreshToken,
        },
      });

      const refreshedIdToken = data?.AuthenticationResult?.IdToken;
      if (typeof refreshedIdToken === "string" && refreshedIdToken) {
        await syncBrowserAuthToken(refreshedIdToken);
        return refreshedIdToken;
      }
    } catch {
      // Continuar al fallback controlado
    }
  }

  // 3. Fallback: retornar el token almacenado si aún parece válido
  if (storedToken && !isJwtExpiringSoon(storedToken, 0)) {
    return storedToken;
  }

  return "";
}

export async function getFreshAuthToken(forceRefresh = false): Promise<string> {
  if (typeof window === "undefined") return "";

  if (!forceRefresh) {
    const stored = getCognitoIdToken();
    if (stored && !isJwtExpiringSoon(stored, 120)) {
      return stored;
    }
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = resolveFreshAuthToken(forceRefresh).finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
