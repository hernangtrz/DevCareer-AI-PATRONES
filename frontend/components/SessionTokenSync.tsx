"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getFreshAuthToken, syncBrowserAuthToken } from "@/lib/cognito";

/**
 * Mantiene sincronizados localStorage ("cognitoIdToken") y la cookie httpOnly
 * "session" cada vez que Supabase refresca el JWT en segundo plano o al
 * reabrir una pestaña con un token próximo a expirar.
 */
export default function SessionTokenSync() {
  useEffect(() => {
    let active = true;

    // Verificación silenciosa al montar la sesión autenticada
    void getFreshAuthToken(false);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (
        (event === "TOKEN_REFRESHED" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION") &&
        session?.access_token
      ) {
        void syncBrowserAuthToken(session.access_token);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
