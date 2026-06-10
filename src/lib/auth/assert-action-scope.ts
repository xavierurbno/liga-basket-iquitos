import { logSecurityEvent } from "../observability/security-log";
import { clubRepository } from "@/repositories/clubRepository";
import { AUTH_ERRORS } from "@/lib/auth/auth-errors";
import { assertOperationalLeagueMatch } from "@/lib/auth/assert-league-scope";
import { checkDelegateClubScope } from "@/lib/auth/delegate-club-scope";
import { extractClubIdFromActionArgs } from "@/lib/auth/extract-club-id-from-args";
import { extractLeagueIdFromActionArgs } from "@/lib/auth/extract-league-id-from-args";
import { clubBelongsToOperationalLeague } from "@/lib/auth/operational-league-scope";
import type { AuthContext } from "@/lib/auth/withAuth";

/** Bloquea leagueId explícito en args que no coincide con la liga operativa del JWT. */
export function checkLeagueIdFromArgsScope(
  context: AuthContext,
  actionArgs: unknown[],
): string | null {
  const leagueIdFromArgs = extractLeagueIdFromActionArgs(actionArgs);
  if (!leagueIdFromArgs) return null;
  return assertOperationalLeagueMatch(context, leagueIdFromArgs);
}

/** Aislamiento de admin de liga por club en args (consulta BD). */
export async function checkLeagueAdminClubScope(
  context: AuthContext,
  actionArgs: unknown[],
): Promise<string | null> {
  if (context.role !== "LEAGUE_ADMIN") return null;

  const clubIdFromArgs = extractClubIdFromActionArgs(actionArgs);
  const leagueId = context.leagueId?.trim();
  if (!clubIdFromArgs || !leagueId) return null;

  const club = await clubRepository.findById(clubIdFromArgs);
  if (!club || !clubBelongsToOperationalLeague(club.leagueId, leagueId, context.role)) {
    logSecurityEvent({
      type: "auth.tenant.league_mismatch",
      message: "Admin de liga intentó operar sobre club fuera de la liga operativa",
      userId: context.userId,
      role: context.role,
      leagueId,
      attemptedClubId: clubIdFromArgs,
      meta: { clubLeagueId: club?.leagueId ?? null },
    });
    return AUTH_ERRORS.unauthorizedLeague;
  }
  return null;
}

/**
 * Aislamiento multi-tenant en server actions (delegado por club, admin de liga por leagueId).
 */
export async function evaluateActionTenantScope(
  context: AuthContext,
  actionArgs: unknown[],
): Promise<string | null> {
  const delegateError = checkDelegateClubScope(context, actionArgs);
  if (delegateError) return delegateError;

  const leagueIdError = checkLeagueIdFromArgsScope(context, actionArgs);
  if (leagueIdError) return leagueIdError;

  return checkLeagueAdminClubScope(context, actionArgs);
}
