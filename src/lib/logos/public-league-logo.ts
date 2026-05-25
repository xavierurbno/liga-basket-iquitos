import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";

/** Rutas públicas (orden de prioridad) para LDDBI / liga principal en `public/`. */
export const PUBLIC_LEAGUE_LOGO_PATHS = [
  "/logo-liga.png",
  "/logos/logo-lddbi.png",
  "/logos/liga.png",
] as const;

/** Primera ruta usada en UI cuando no hay `login_logo_url` en BD (debe existir en `public/`). */
export const DEFAULT_PUBLIC_LEAGUE_LOGO = PUBLIC_LEAGUE_LOGO_PATHS[0];

export { isPrimaryPortalLeagueSlug };

/**
 * Logo grande en `/login/`: el de la liga si existe; `public/` solo para LDDBI/Iquitos
 * o cuando no hay liga en la URL.
 */
export function resolveLoginHeroLogoUrl(
  league: { logoUrl: string | null; slug: string } | null,
): string | null {
  const url = league?.logoUrl?.trim();
  if (url) return url;
  if (!league) return DEFAULT_PUBLIC_LEAGUE_LOGO;
  if (isPrimaryPortalLeagueSlug(league.slug)) return DEFAULT_PUBLIC_LEAGUE_LOGO;
  return null;
}
