import type { User } from "@supabase/supabase-js";

/**
 * Correo con bypass de rol (intranet). Sobrescribible con `MASTER_SUPER_ADMIN_EMAIL` en Vercel.
 * Valor por defecto solo para entornos sin variable (desarrollo local).
 */
function readMasterSuperAdminEmailFromEnv(): string {
  const raw = process.env.MASTER_SUPER_ADMIN_EMAIL;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().toLowerCase();
  }
  console.warn(
    "[intranet-gate] MASTER_SUPER_ADMIN_EMAIL no está definido; el bypass por correo maestro queda desactivado.",
  );
  return "";
}

/** Resuelto una vez al cargar el módulo (Edge/Node). */
export const MASTER_SUPER_ADMIN_EMAIL = readMasterSuperAdminEmailFromEnv();

/**
 * Roles con acceso a la intranet `/liga/*` y `/dashboard/*`.
 * El proxy también permite acceso si el correo coincide con {@link MASTER_SUPER_ADMIN_EMAIL}.
 */
export const INTRANET_LIGA_ROLES = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"] as const;

export function isMasterSuperAdminEmail(email: string | undefined): boolean {
  if (!MASTER_SUPER_ADMIN_EMAIL) return false;
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === MASTER_SUPER_ADMIN_EMAIL;
}

export function isMasterSuperAdminUser(user: Pick<User, "email"> | null): boolean {
  return Boolean(user && isMasterSuperAdminEmail(user.email ?? undefined));
}

export function hasAllowedLigaRole(role: string | undefined): boolean {
  if (typeof role !== "string") return false;
  const trimmed = role.trim();
  return trimmed.length > 0 && (INTRANET_LIGA_ROLES as readonly string[]).includes(trimmed);
}

/**
 * `true` si el JWT tiene rol de intranet ({@link INTRANET_LIGA_ROLES}) o es el correo maestro.
 * Usada en `src/proxy.ts` y en login para no enviar a `/liga` a cuentas públicas.
 */
export function canAccessIntranet(user: User | null, roleFromJwt: string | undefined): boolean {
  return isMasterSuperAdminUser(user) || hasAllowedLigaRole(roleFromJwt);
}

export function actsAsSuperAdminInProxy(user: User | null, roleFromJwt: string | undefined): boolean {
  return isMasterSuperAdminUser(user) || roleFromJwt === "SUPER_ADMIN";
}
