import type { User } from "@supabase/supabase-js";

/**
 * Rol de autorización desde JWT (`app_metadata` únicamente).
 * No usar `user_metadata.role`: es editable por el usuario en Supabase.
 */
export function readUserRole(user: User | null): string | undefined {
  if (!user) return undefined;
  const fromApp = user.app_metadata?.role;
  if (typeof fromApp === "string" && fromApp.trim()) return fromApp.trim();

  if (process.env.NODE_ENV === "development") {
    const legacy = user.user_metadata?.role;
    if (typeof legacy === "string" && legacy.trim()) {
      console.warn(
        `[auth] Usuario ${user.id} tiene role en user_metadata (${legacy.trim()}); migrar a app_metadata.`,
      );
    }
  }

  return undefined;
}

export function canUploadNormativaDoc(role: string | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";
}
