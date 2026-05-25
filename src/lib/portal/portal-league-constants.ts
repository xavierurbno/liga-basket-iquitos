/** Slugs de la liga de Iquitos (portada `/`). Orden de prioridad. Sin dependencias de BD. */
export const PRIMARY_PORTAL_LEAGUE_SLUGS = ["lddbi", "iquitos"] as const;

export function isPrimaryPortalLeagueSlug(slug: string | null | undefined): boolean {
  const n = slug?.trim().toLowerCase();
  if (!n) return false;
  return (PRIMARY_PORTAL_LEAGUE_SLUGS as readonly string[]).includes(n);
}
