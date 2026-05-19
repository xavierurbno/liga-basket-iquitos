import type { AuthError } from "@supabase/supabase-js";

/** Sesión en cookies caducada o revocada en Supabase (muy común en dev tras cambiar proyecto/keys). */
export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as AuthError).code ?? (error as { code?: string }).code;
  if (code === "refresh_token_not_found") return true;
  const message = String((error as AuthError).message ?? "");
  return message.toLowerCase().includes("refresh token not found");
}
