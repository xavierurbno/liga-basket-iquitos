"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type GoogleOAuthResult = {
  url: string | null;
  error: string | null;
};

/**
 * Inicia OAuth con Google y devuelve la URL de Google (sin `redirect()` de Next).
 * El cliente debe navegar con `window.location.href = res.url`.
 */
export async function signInWithGoogleAction(redirectTo: string): Promise<GoogleOAuthResult> {
  const trimmed = redirectTo?.trim() ?? "";
  if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
    return { url: null, error: "URL de retorno inválida." };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Action: set de cookies puede fallar si la respuesta ya se envió */
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: trimmed,
    },
  });

  if (error) {
    return { url: null, error: error.message };
  }

  if (!data?.url) {
    return {
      url: null,
      error: "No se recibió la URL de autenticación de Google.",
    };
  }

  return { url: data.url, error: null };
}
