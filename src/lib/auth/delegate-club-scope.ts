import { logSecurityEvent } from "../observability/security-log";
import { AUTH_ERRORS } from "./auth-errors";
import { extractClubIdFromActionArgs } from "./extract-club-id-from-args";
import type { AuthContext } from "./withAuth";

/** Aislamiento de delegado por club (sin I/O). */
export function checkDelegateClubScope(
  context: AuthContext,
  actionArgs: unknown[],
): string | null {
  if (context.role !== "CLUB_DELEGATE") return null;

  if (!context.clubId?.trim()) {
    logSecurityEvent({
      type: "auth.tenant.club_mismatch",
      message: "Delegado sin club_id en JWT intentó una acción acotada por club",
      userId: context.userId,
      role: context.role,
    });
    return "Tu cuenta no tiene un club asignado. Contacta al administrador de la liga.";
  }

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
