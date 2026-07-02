import { cache } from "react";
import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { leagueRepository } from "@/repositories/league.repository";
import { loadLeaguePortalBranding, type LeaguePortalBranding } from "@/lib/leagues/league-branding";

/** Alias de `/` (Fase 4: directorio en raíz). */
export const PROGRAM_LEAGUES_DIRECTORY_PATH = "/";

/** Liga por defecto para redirecciones legadas (`/busqueda-365`, `/normativas`, etc.). */
export const fetchDefaultPortalLeagueBranding = cache(
  async (): Promise<LeaguePortalBranding | null> => {
    try {
      const league = await leagueRepository.findDefaultForPortal(unauthenticatedReadDb());
      if (!league) return null;
      return loadLeaguePortalBranding(league);
    } catch {
      return null;
    }
  },
);

export async function isPrimaryPortalLeagueId(leagueId: string): Promise<boolean> {
  const primary = await leagueRepository.findDefaultForPortal(unauthenticatedReadDb());
  return primary?.id === leagueId;
}
