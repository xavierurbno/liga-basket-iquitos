/** Cookie de contexto para redirecciones legadas (`/galeria-institucional/`, etc.). */
export const ACTIVE_LEAGUE_SLUG_COOKIE = "active_league_slug";

export const ACTIVE_LEAGUE_SLUG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const activeLeagueSlugCookieOptions = {
  path: "/",
  maxAge: ACTIVE_LEAGUE_SLUG_COOKIE_MAX_AGE,
  sameSite: "lax" as const,
};
