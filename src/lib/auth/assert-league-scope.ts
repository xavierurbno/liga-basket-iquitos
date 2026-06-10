import type { AuthContext } from "@/lib/auth/withAuth";

/**
 * SUPER_ADMIN: puede operar cualquier liga (vía cookie active_league_id).
 * LEAGUE_ADMIN / CLUB_DELEGATE: solo su liga operativa del JWT.
 */
export function assertOperationalLeagueMatch(
  context: AuthContext,
  targetLeagueId: string,
): string | null {
  if (context.role === "SUPER_ADMIN") return null;

  const operational = context.leagueId?.trim();
  if (!operational) {
    return "Sesión sin liga asignada. Contacta al administrador.";
  }
  if (operational !== targetLeagueId.trim()) {
    return "No tienes permiso para operar sobre esta liga.";
  }
  return null;
}

/** Resuelve leagueId del cliente: SUPER_ADMIN puede usar form; resto solo contexto. */
export function resolveClientLeagueId(
  context: AuthContext,
  formLeagueId?: string | null,
): string | null {
  if (context.role === "SUPER_ADMIN") {
    return formLeagueId?.trim() || context.leagueId?.trim() || null;
  }
  return context.leagueId?.trim() || null;
}
