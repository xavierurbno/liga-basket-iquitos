/**
 * Jerarquía intranet LDDBI (roles con acceso a `/dashboard` e intranet; administración de normativas en `/normativas/`).
 * - SUPER_ADMIN: bypass de filtros por club en datos cuando corresponda.
 * - LEAGUE_ADMIN / CLUB_DELEGATE: intranet con alcance liga/club.
 * - PUBLIC: sin acceso a /dashboard (intranet).
 */
export const INTRANET_ROLES = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"] as const;

export type IntranetRole = (typeof INTRANET_ROLES)[number];

export function hasIntranetAccess(role: string | undefined | null): role is IntranetRole {
  if (!role) return false;
  return (INTRANET_ROLES as readonly string[]).includes(role);
}

/** Lista blanca para panel de gestión (`/liga`) y rutas intranet (`/dashboard` redirige a `/normativas/`). */
export function isManagementWhitelistedRole(role: string | undefined | null): boolean {
  return hasIntranetAccess(role);
}

/** Sesión explícitamente sin rol operativo (portal solo). */
export function isPublicOrUnsetRole(role: string | undefined | null): boolean {
  if (role === "PUBLIC") return true;
  if (role === undefined || role === null) return true;
  if (typeof role === "string" && role.trim() === "") return true;
  return false;
}

/** Texto del enlace resaltado en la barra del sistema (`/liga`). */
export function intranetPortalNavLabel(role: string | undefined | null): string {
  if (!hasIntranetAccess(role)) return "Intranet";
  return "Panel de gestión";
}

/** Bypass de filtros por club en consultas Drizzle (solo SUPER_ADMIN). */
export function isSuperAdminDataScope(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN";
}
