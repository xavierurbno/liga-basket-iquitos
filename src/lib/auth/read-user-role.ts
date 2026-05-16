import type { User } from "@supabase/supabase-js";

/** Lee rol desde JWT (Supabase suele usar `app_metadata`; algunos proyectos duplican en `user_metadata`). */
export function readUserRole(user: User | null): string | undefined {
  if (!user) return undefined;
  const fromApp = user.app_metadata?.role;
  const fromUser = user.user_metadata?.role;
  if (typeof fromApp === "string" && fromApp.trim()) return fromApp.trim();
  if (typeof fromUser === "string" && fromUser.trim()) return fromUser.trim();
  return undefined;
}

export function canUploadNormativaDoc(role: string | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";
}
