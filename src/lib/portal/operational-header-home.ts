import { isDefaultPortalLeagueSlug } from "@/lib/portal/default-portal-league";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";

/** Destino del logo en cabecera operativa (`/liga/*`): portal público, no el panel. */
export async function resolveOperationalHeaderHomeHref(
  activeLeagueSlug: string | null | undefined,
): Promise<string> {
  const slug = activeLeagueSlug?.trim();
  if (!slug) return "/";
  if (await isDefaultPortalLeagueSlug(slug)) return "/";
  return leaguePortalHome(slug);
}
