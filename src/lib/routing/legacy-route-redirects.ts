import type { NextRequest } from "next/server";
import { leaguePortalTournament } from "../portal/league-portal-paths.ts";
import { ACTIVE_LEAGUE_SLUG_COOKIE } from "../portal/active-league-cookie.ts";

export type LegacyRedirect = {
  pathname: string;
  permanent?: boolean;
};

function pathnameCanon(path: string): string {
  if (path === "/" || path === "") return "/";
  return path.replace(/\/+$/, "") || "/";
}

/**
 * Resuelve redirecciones de rutas legado → canónicas (Fase 6).
 * Devuelve null si la ruta no es legado.
 */
export function resolveLegacyRouteRedirectFromPath(
  pathname: string,
  options?: { activeLeagueSlug?: string | null },
): LegacyRedirect | null {
  const canon = pathnameCanon(pathname);

  if (canon === "/dashboard/normativas" || pathname.startsWith("/dashboard/normativas/")) {
    const suffix = pathname.slice("/dashboard/normativas".length) || "/";
    return { pathname: `/normativas${suffix === "/" ? "/" : suffix}` };
  }

  if (canon === "/liga/clubes" || pathname.startsWith("/liga/clubes/")) {
    const suffix = pathname.slice("/liga/clubes".length) || "/";
    return { pathname: `/liga/clubs${suffix === "/" ? "/" : suffix}` };
  }

  const torneoMatch = pathname.match(/^\/torneos\/([^/]+)\/([^/]+)\/?$/);
  if (torneoMatch) {
    const [, leagueSlug, tournamentSlug] = torneoMatch;
    return {
      pathname: leaguePortalTournament(leagueSlug, tournamentSlug),
      permanent: true,
    };
  }

  if (canon === "/liga/busqueda-365" || pathname.startsWith("/liga/busqueda-365/")) {
    const slug = options?.activeLeagueSlug?.trim();
    return {
      pathname: slug ? `/l/${slug}/busqueda-365/` : "/busqueda-365/",
    };
  }

  return null;
}

export function resolveLegacyRouteRedirect(request: NextRequest): LegacyRedirect | null {
  return resolveLegacyRouteRedirectFromPath(request.nextUrl.pathname, {
    activeLeagueSlug: request.cookies.get(ACTIVE_LEAGUE_SLUG_COOKIE)?.value,
  });
}

/** Rutas legado documentadas (para métricas / deprecación). */
export const LEGACY_ROUTE_INVENTORY = [
  { from: "/torneos/[leagueSlug]/[tournamentSlug]/", to: "/l/[slug]/torneos/[tournamentSlug]/" },
  { from: "/liga/clubes/", to: "/liga/clubs/" },
  { from: "/dashboard/normativas/", to: "/normativas/" },
  { from: "/busqueda-365/", to: "/l/[slug]/busqueda-365/ o directorio /ligas/" },
  { from: "/liga/busqueda-365/", to: "/l/[slug]/busqueda-365/" },
] as const;
