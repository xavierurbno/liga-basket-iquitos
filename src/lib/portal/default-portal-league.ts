import { cache } from "react";
import { PRIMARY_PORTAL_LEAGUE_SLUGS } from "@/lib/portal/portal-league-constants";
import { leagueRepository } from "@/repositories/league.repository";
import { loadLeaguePortalBranding, type LeaguePortalBranding } from "@/lib/leagues/league-branding";

/** Directorio para elegir otras ligas del programa. */
export const PROGRAM_LEAGUES_DIRECTORY_PATH = "/ligas/";

export { PRIMARY_PORTAL_LEAGUE_SLUGS };

/** Liga mostrada en la portada `/` (Iquitos / LDDBI). */
export const fetchDefaultPortalLeagueBranding = cache(
  async (): Promise<LeaguePortalBranding | null> => {
    try {
      const league = await leagueRepository.findDefaultForPortal();
      if (!league) return null;
      return loadLeaguePortalBranding(league);
    } catch {
      return null;
    }
  },
);

export async function isDefaultPortalLeagueSlug(slug: string): Promise<boolean> {
  const normalized = slug.trim().toLowerCase();
  if ((PRIMARY_PORTAL_LEAGUE_SLUGS as readonly string[]).includes(normalized)) {
    return true;
  }
  const primary = await leagueRepository.findDefaultForPortal();
  return primary?.slug.trim().toLowerCase() === normalized;
}

export async function isPrimaryPortalLeagueId(leagueId: string): Promise<boolean> {
  const primary = await leagueRepository.findDefaultForPortal();
  return primary?.id === leagueId;
}
