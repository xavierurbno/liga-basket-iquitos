import { logSecurityEvent } from "../observability/security-log.ts";
import { AUTH_ERRORS } from "./auth-errors.ts";
import { extractClubIdFromActionArgs } from "./extract-club-id-from-args.ts";
import type { AuthContext } from "./withAuth.ts";

/** Aislamiento de delegado por club (sin I/O). */
export function checkDelegateClubScope(
  context: AuthContext,
  actionArgs: unknown[],
): string | null {
  if (context.role !== "CLUB_DELEGATE") return null;

  const clubIdFromArgs = extractClubIdFromActionArgs(actionArgs);
  if (clubIdFromArgs && context.clubId && clubIdFromArgs !== context.clubId) {
    logSecurityEvent({
      type: "auth.tenant.club_mismatch",
      message: "Delegado intentó operar sobre un club ajeno",
      userId: context.userId,
      role: context.role,
      clubId: context.clubId,
      attemptedClubId: clubIdFromArgs,
    });
    return AUTH_ERRORS.unauthorizedClub;
  }
  return null;
}
