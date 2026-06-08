import "server-only";

import { cookies } from "next/headers";
import { getActiveLeagueIdFromCookies } from "@/lib/auth/active-league";
import { leagueRepository } from "@/repositories/league.repository";

/** Liga cuyos `league_settings` deben leerse (explícita → cookie activa → portal por defecto). */
export async function resolveLeagueSettingsScopeId(
  explicitLeagueId?: string | null,
): Promise<string | null> {
  const explicit = explicitLeagueId?.trim();
  if (explicit) return explicit;

  const cookieStore = await cookies();
  const active = getActiveLeagueIdFromCookies(cookieStore);
  if (active?.trim()) return active.trim();

  const defaultLeague = await leagueRepository.findDefaultForPortal();
  return defaultLeague?.id?.trim() ?? null;
}
