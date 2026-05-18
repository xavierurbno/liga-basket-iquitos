import type { User } from "@supabase/supabase-js";
import { readUserRole } from "@/lib/auth/read-user-role";

function emailsFromCommaEnv(key: string): Set<string> {
  const raw = process.env[key];
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Panel con tabs sensibles / listados globales de liga.
 * Usa `app_metadata.role` (vía readUserRole) y `DASHBOARD_ADMIN_EMAILS` (solo servidor).
 */
export function isDashboardSuperAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  if (readUserRole(user) === "SUPER_ADMIN") return true;
  const email = user.email?.trim().toLowerCase();
  return Boolean(email && emailsFromCommaEnv("DASHBOARD_ADMIN_EMAILS").has(email));
}
