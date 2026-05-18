import type { Role } from "@/lib/auth/withAuth";

/** Staff de liga/super admin opera siempre en contexto de una liga activa. */
export function staffRequiresOperationalLeague(role: string | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";
}

export function clubBelongsToOperationalLeague(
  clubLeagueId: string | null | undefined,
  operationalLeagueId: string | null | undefined,
  role: Role | string | undefined,
): boolean {
  if (!staffRequiresOperationalLeague(role)) return true;
  const lid = operationalLeagueId?.trim();
  if (!lid) return false;
  return clubLeagueId?.trim() === lid;
}

export function operationalLeagueRequiredMessage(): string {
  return "Selecciona una liga activa en la barra superior antes de continuar.";
}
