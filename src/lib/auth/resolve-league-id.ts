import type { User } from "@supabase/supabase-js";
import { getActiveLeagueIdFromCookies } from "@/lib/auth/active-league";
import type { Role } from "@/lib/auth/withAuth";

export function resolveLeagueIdFromUser(user: User): string | null {
  const meta = user.app_metadata as { league_id?: string; leagueId?: string };
  const raw = meta.league_id ?? meta.leagueId;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * Liga operativa para módulos /liga/* y server actions.
 * - SUPER_ADMIN: cookie `active_league_id`, luego JWT.
 * - LEAGUE_ADMIN / CLUB_DELEGATE: solo JWT (no cookie).
 */
export function resolveOperationalLeagueId(
  user: User,
  cookieStore?: { get(name: string): { value: string } | undefined }
): string | null {
  const role = user.app_metadata?.role as Role | undefined;
  const fromMeta = resolveLeagueIdFromUser(user);
  const fromCookie = cookieStore ? getActiveLeagueIdFromCookies(cookieStore) : null;

  if (role === "SUPER_ADMIN") {
    const meta = user.app_metadata as { active_league_id?: string };
    const fromJwtActive =
      typeof meta.active_league_id === "string" && meta.active_league_id.trim()
        ? meta.active_league_id.trim()
        : null;
    return fromCookie ?? fromJwtActive ?? fromMeta;
  }
  return fromMeta;
}

/** Pantalla “Selecciona una liga” (super admin sin contexto o league admin sin asignación). */
export function needsOperationalLeagueSelection(
  role: string | undefined,
  leagueId: string | null
): boolean {
  if (!leagueId && (role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN")) {
    return true;
  }
  return false;
}

export function canManageTournaments(role: string | undefined): boolean {
  return role === "LEAGUE_ADMIN" || role === "SUPER_ADMIN";
}
