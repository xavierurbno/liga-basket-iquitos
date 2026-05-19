"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";

/**
 * En login/registro: si hay cookies `sb-*` con refresh token inválido, Supabase
 * devuelve 400 en el navegador. Hacemos signOut silencioso para limpiar cookies.
 */
export function StaleSessionCleanup() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    void (async () => {
      const { error } = await supabase.auth.getSession();
      if (error && isInvalidRefreshTokenError(error)) {
        await supabase.auth.signOut();
      }
    })();
  }, []);

  return null;
}
