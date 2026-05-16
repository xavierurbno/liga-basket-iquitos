import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { User } from "@supabase/supabase-js";

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
 * Wrapper de autorización (HOC) robusto para Server Actions.
 * Soporta tanto acciones con FormData como acciones con parámetros tipados.
 */
export function withAuth<T, P extends any[]>(
  action: (...args: [...P, User, AuthContext]) => Promise<T>,
  requiredRoles: Role | Role[]
) {
  return async (...args: P): Promise<T | { success: false; error: string }> => {
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
                // Silenciamos fallos de set en server actions si ya se enviaron cabeceras
              }
            },
          },
        }
      );

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: "No autenticado. Por favor, inicia sesión." };
      }

      const role = user.app_metadata?.role as Role;
      const clubIdFromMeta = user.app_metadata?.club_id as string | undefined;
      const leagueIdFromMeta = user.app_metadata?.league_id as string | undefined;

      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      // 1. RBAC
      if (!role || !rolesArray.includes(role)) {
        return { success: false, error: "Acceso denegado: Permisos insuficientes." };
      }

      // 2. Aislamiento de Tenant (Solo si el primer argumento es FormData y el rol es CLUB_DELEGATE)
      if (role === "CLUB_DELEGATE" && args[0] instanceof FormData) {
        const formData = args[0];
        const clubIdFromForm = formData.get("clubId") as string;
        if (clubIdFromForm && clubIdFromMeta && clubIdFromForm !== clubIdFromMeta) {
          console.warn(`[SECURITY] User ${user.id} attempted to access unauthorized club ${clubIdFromForm}`);
          return { success: false, error: "Acceso denegado: Intento de modificación no autorizada." };
        }
      }

      const context: AuthContext = {
        userId: user.id,
        role,
        clubId: clubIdFromMeta,
        leagueId: leagueIdFromMeta,
      };

      // 3. Ejecutar acción pasando los argumentos originales + user + context
      return await action(...args, user, context);
    } catch (error: any) {
      console.error("Auth Wrapper Error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Error de autorización." 
      };
    }
  };
}
