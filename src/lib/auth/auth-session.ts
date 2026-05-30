import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerFromCookies } from "@/lib/supabase/server";
import { AUTH_ERRORS } from "@/lib/auth/auth-errors";
import { logSecurityEvent } from "../observability/security-log";
import { evaluateActionTenantScope } from "@/lib/auth/assert-action-scope";
import { readUserRole } from "@/lib/auth/read-user-role";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import type { AuthContext, Role } from "@/lib/auth/withAuth";

export type AuthDenied = { denied: true; error: string };
export type AuthOk = { denied: false; user: User; context: AuthContext };
export type AuthSessionResult = AuthDenied | AuthOk;

/**
 * Resuelve sesión, rol, contexto operativo y alcance tenant para server actions.
 */
export async function resolveAuthSession(
  requiredRoles: Role | Role[],
  actionArgs: unknown[] = [],
): Promise<AuthSessionResult> {
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerFromCookies();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { denied: true, error: AUTH_ERRORS.unauthenticated };
    }

    const role = readUserRole(user) as Role | undefined;
    if (!role) {
      return { denied: true, error: AUTH_ERRORS.noRole };
    }

    if (!rolesArray.includes(role)) {
      return { denied: true, error: AUTH_ERRORS.insufficientRole };
    }

    const clubIdFromMeta = user.app_metadata?.club_id as string | undefined;
    const leagueIdFromMeta = user.app_metadata?.league_id as string | undefined;
    const operationalLeagueId = resolveOperationalLeagueId(user, cookieStore);

    const context: AuthContext = {
      userId: user.id,
      role,
      clubId: clubIdFromMeta,
      leagueId: operationalLeagueId ?? leagueIdFromMeta,
    };

    const tenantError = await evaluateActionTenantScope(context, actionArgs);
    if (tenantError) {
      logSecurityEvent({
        type: "auth.denied",
        message: tenantError,
        userId: context.userId,
        role: context.role,
        clubId: context.clubId,
        leagueId: context.leagueId,
      });
      return { denied: true, error: tenantError };
    }

    return { denied: false, user, context };
  } catch (err) {
    logSecurityEvent(
      {
        type: "auth.session.failure",
        message: err instanceof Error ? err.message : AUTH_ERRORS.authFailure,
      },
      { level: "error" },
    );
    return { denied: true, error: AUTH_ERRORS.authFailure };
  }
}
