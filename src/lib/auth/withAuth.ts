import type { User } from "@supabase/supabase-js";
import { AUTH_ERRORS } from "@/lib/auth/auth-errors";
import { resolveAuthSession } from "@/lib/auth/auth-session";

/**
 * Roles permitidos en el sistema LDDBI.
 */
export type Role = "SUPER_ADMIN" | "LEAGUE_ADMIN" | "CLUB_DELEGATE";

export interface AuthContext {
  userId: string;
  role: Role;
  clubId?: string;
  leagueId?: string;
}

/**
 * Wrapper de autorización (HOC) para Server Actions.
 * Soporta FormData y parámetros tipados; devuelve `{ success: false, error }` al denegar.
 */
export function withAuth<T, P extends unknown[]>(
  action: (...args: [...P, User, AuthContext]) => Promise<T>,
  requiredRoles: Role | Role[],
) {
  return async (...args: P): Promise<T | { success: false; error: string }> => {
    const auth = await resolveAuthSession(requiredRoles, args);
    if (auth.denied) {
      return { success: false, error: auth.error };
    }

    try {
      return await action(...args, auth.user, auth.context);
    } catch (error: unknown) {
      console.error("Auth Wrapper Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : AUTH_ERRORS.authFailure,
      };
    }
  };
}
