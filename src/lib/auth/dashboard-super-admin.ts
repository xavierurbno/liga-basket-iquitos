import type { User } from "@supabase/supabase-js";

function emailsFromCommaEnv(key: string): Set<string> {
  const raw = process.env[key];
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Indica si el usuario ve el panel como “super” de liga (tabs sensibles, listados globales).
 * Usa `app_metadata.role` y correos en `DASHBOARD_ADMIN_EMAILS` (solo servidor, separados por comas).
 * `NEXT_PUBLIC_ADMIN_EMAIL` se mantiene solo como compatibilidad hasta migrar variables en despliegue.
 */
export function isDashboardSuperAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role;
  if (role === "SUPER_ADMIN") return true;
  const email = user.email?.trim().toLowerCase();
  if (email && emailsFromCommaEnv("DASHBOARD_ADMIN_EMAILS").has(email)) return true;
  const legacy = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(legacy && email && email === legacy);
}
