import type { AuthContext } from "@/lib/auth/withAuth";

/**
 * Liga destino al subir normativas: operativa (cookie/JWT) o campo explícito del formulario.
 */
export function resolveNormativaUploadLeagueId(
  context: AuthContext,
  formLeagueId?: string | null,
): string | null {
  const fromForm = formLeagueId?.trim() || null;
  const operational = context.leagueId?.trim() || null;

  if (context.role === "SUPER_ADMIN") {
    return fromForm ?? operational;
  }
  if (context.role === "LEAGUE_ADMIN") {
    return operational;
  }
  return null;
}
