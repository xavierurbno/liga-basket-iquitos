import { isPlatformDefaultLeagueSlug } from "@/lib/platform/platform-config";

/**
 * Slugs históricos LDDBI — usar solo en seeds/scripts, no en runtime de portal.
 * @see PLATFORM_DEFAULT_LEAGUE_SLUG en producción
 */
export const PRIMARY_PORTAL_LEAGUE_SLUGS = ["lddbi", "iquitos"] as const;

/**
 * Identifica la liga “principal” del programa (p. ej. LDDBI) para branding/carnet.
 * Preferir isPlatformDefaultLeagueSlug cuando aplique.
 */
export function isPrimaryPortalLeagueSlug(slug: string | null | undefined): boolean {
  if (isPlatformDefaultLeagueSlug(slug)) return true;
  const n = slug?.trim().toLowerCase();
  if (!n) return false;
  if (process.env.PLATFORM_DEFAULT_LEAGUE_SLUG?.trim()) return false;
  return (PRIMARY_PORTAL_LEAGUE_SLUGS as readonly string[]).includes(n);
}
