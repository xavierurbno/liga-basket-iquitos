"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { AuthError } from "@supabase/supabase-js";
import { canAccessIntranet } from "@/lib/auth/intranet-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";
import { isAllowedOAuthRedirectUrl } from "@/lib/security/oauth-redirect";

export type GoogleOAuthResult = {
  url: string | null;
  error: string | null;
};

export type SignInWithPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

function mensajeLogin(error: AuthError): string {
  const msg = error.message ?? "";
  const lower = msg.toLowerCase();

  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return (
      "Correo o contraseña incorrectos. " +
      "Comprueba que el usuario exista en Supabase → Authentication → Users."
    );
  }
  if (lower.includes("email not confirmed")) {
    return "Debes confirmar el correo antes de entrar.";
  }
  if (lower.includes("too many requests")) {
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  }
  return msg || "No se pudo iniciar sesión.";
}

function safePostLoginPath(raw: string | null | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/liga/";
}

/**
 * Login con email/contraseña en el servidor para que las cookies `sb-*` viajen
 * en la respuesta HTTP (en Vercel el login solo en el navegador no las persiste para el proxy).
 */
export async function signInWithPasswordAction(input: {
  email: string;
  password: string;
  leagueSlug?: string | null;
  postLoginRedirect?: string | null;
}): Promise<SignInWithPasswordResult> {
  const rateError = await enforceRateLimit("login");
  if (rateError) {
    return { ok: false, error: rateError };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error) {
    return { ok: false, error: mensajeLogin(error) };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, error: "No se pudo obtener la sesión tras el login." };
  }

  const cookieStore = await cookies();
  if (input.leagueSlug?.trim()) {
    cookieStore.set("active_league_slug", input.leagueSlug.trim(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    cookieStore.delete("active_league_slug");
  }

  const role = typeof user.app_metadata?.role === "string" ? user.app_metadata.role : undefined;
  const target = canAccessIntranet(user, role)
    ? safePostLoginPath(input.postLoginRedirect)
    : "/";

  redirect(target);
}

/**
 * Inicia OAuth con Google en el servidor (no recomendado para PKCE en producción).
 * Preferir `signInWithOAuth` en el navegador (`LoginForm`) para que el code_verifier
 * quede en cookies del cliente antes de ir a Google.
 */
export async function signInWithGoogleAction(redirectTo: string): Promise<GoogleOAuthResult> {
  const trimmed = redirectTo?.trim() ?? "";
  if (!isAllowedOAuthRedirectUrl(trimmed)) {
    return { url: null, error: "URL de retorno no permitida para OAuth." };
  }

  const supabase = await createSupabaseServerClient();

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
