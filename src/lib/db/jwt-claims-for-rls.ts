import type { User } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/withAuth";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";

/**
 * Payload para `set_config('request.jwt.claims', …)` en sesiones liga_app.
 * Debe alinearse con app_metadata que Supabase Auth escribe en el JWT real.
 */
export function buildSupabaseJwtClaimsPayload(
  user: User,
  context: AuthContext,
  cookieStore?: { get(name: string): { value: string } | undefined },
): Record<string, unknown> {
  const operationalLeagueId = resolveOperationalLeagueId(user, cookieStore);
  const appMetadata: Record<string, unknown> = {
    role: context.role,
  };

  if (context.clubId) {
    appMetadata.club_id = context.clubId;
  }
  if (context.leagueId) {
    appMetadata.league_id = context.leagueId;
  }
  if (operationalLeagueId) {
    appMetadata.active_league_id = operationalLeagueId;
  }

  return {
    sub: user.id,
    role: "authenticated",
    app_metadata: appMetadata,
  };
}

export function serializeJwtClaimsForPostgres(claims: Record<string, unknown>): string {
  return JSON.stringify(claims);
}
