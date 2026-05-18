import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import type { AuthContext, Role } from "@/lib/auth/withAuth";

export type AuthDenied = { denied: true; error: string };
export type AuthOk = { denied: false; user: User; context: AuthContext };

export type RequireAuthResult = AuthDenied | AuthOk;

/** Verificación de sesión y rol para server actions con respuestas propias (no ActionResult). */
export async function requireAuth(requiredRoles: Role | Role[]): Promise<RequireAuthResult> {
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              /* headers ya enviados */
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { denied: true, error: "No autenticado. Por favor, inicia sesión." };
    }

    const role = user.app_metadata?.role as Role | undefined;
    if (!role || !rolesArray.includes(role)) {
      return { denied: true, error: "Acceso denegado: permisos insuficientes." };
    }

    const clubIdFromMeta = user.app_metadata?.club_id as string | undefined;
    const leagueIdFromMeta = user.app_metadata?.league_id as string | undefined;
    const operationalLeagueId = resolveOperationalLeagueId(user, cookieStore);

    return {
      denied: false,
      user,
      context: {
        userId: user.id,
        role,
        clubId: clubIdFromMeta,
        leagueId: operationalLeagueId ?? leagueIdFromMeta,
      },
    };
  } catch (err) {
    console.error("[requireAuth]", err);
    return { denied: true, error: "Error de autorización." };
  }
}
