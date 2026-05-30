import {
  resolveAuthSession,
  type AuthDenied,
  type AuthOk,
  type AuthSessionResult,
} from "@/lib/auth/auth-session";
import type { Role } from "@/lib/auth/withAuth";

export type { AuthDenied, AuthOk, AuthSessionResult };
export type RequireAuthResult = AuthSessionResult;

/**
 * Verificación de sesión y rol para server actions con respuestas propias (no ActionResult).
 * Opcionalmente valida alcance tenant con los argumentos de la action (FormData / clubId).
 */
export async function requireAuth(
  requiredRoles: Role | Role[],
  actionArgs: unknown[] = [],
): Promise<RequireAuthResult> {
  return resolveAuthSession(requiredRoles, actionArgs);
}
