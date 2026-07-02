import { leagueRepository } from "@/repositories/league.repository";
import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { fetchPortalLeagueBranding } from "@/lib/portal/portal-league-cache";
import type { LeaguePortalBranding } from "@/lib/leagues/league-branding";
import { loadLeaguePortalBranding } from "@/lib/leagues/league-branding";
import { parseLeagueSlugFromPortalPath } from "@/lib/portal/league-portal-paths";

/**
 * Liga cuyo branding debe mostrarse en `/login/`.
 * Prioridad: `?l=` → slug en `?next=` (`/l/[slug]/`) → liga principal del programa.
 */
export async function resolveLoginPortalLeague(opts: {
  slugParam?: string | null;
  nextPath?: string | null;
}): Promise<LeaguePortalBranding | null> {
  const fromParam = opts.slugParam?.trim() || null;
  const fromNext =
    opts.nextPath?.trim() ? parseLeagueSlugFromPortalPath(opts.nextPath.trim()) : null;
  const slug = fromParam || fromNext;

  if (slug) {
    const branded = await fetchPortalLeagueBranding(slug);
    if (branded) return branded;
  }

  try {
    const fallback = await leagueRepository.findDefaultForPortal(unauthenticatedReadDb());
    if (!fallback) return null;
    return (
      (await fetchPortalLeagueBranding(fallback.slug)) ?? loadLeaguePortalBranding(fallback)
    );
  } catch {
    return null;
  }
}
