import { leaguePortalHome } from "@/lib/portal/league-portal-paths";

/** Destino del logo en cabecera operativa: portal público de la liga activa. */
export function resolveOperationalHeaderHomeHref(
  activeLeagueSlug: string | null | undefined,
): string {
  const slug = activeLeagueSlug?.trim();
  if (!slug) return "/";
  return leaguePortalHome(slug);
}
