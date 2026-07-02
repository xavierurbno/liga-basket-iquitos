import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  actsAsSuperAdminInProxy,
  canAccessIntranet,
  isMasterSuperAdminUser,
} from "@/lib/auth/intranet-gate";
import {
  isIpAllowedForMasterAdmin,
  isMasterAdminIpAllowlistConfigured,
  MASTER_ADMIN_IP_BLOCKED_CODE,
} from "@/lib/auth/master-admin-ip-allowlist";
import { getClientIpFromHeaders, getClientIpFromRequest } from "@/lib/security/client-ip";
import {
  logRateLimitBlocked,
  logSecurityEvent,
  logSensitiveRouteAllowed,
} from "@/lib/observability/security-log";
import {
  checkRateLimit,
  rateLimitExceededMessage,
} from "@/lib/security/rate-limit";

function isSuperAdminPath(pathnameCanon: string, pathname: string): boolean {
  return pathnameCanon === "/super-admin" || pathname.startsWith("/super-admin/");
}

/** Rutas intranet donde se registra acceso exitoso (Fase 3). */
function resolveSensitiveRoute(pathnameCanon: string, pathname: string): string | null {
  if (isSuperAdminPath(pathnameCanon, pathname)) return "/super-admin";
  if (pathnameCanon === "/liga/documentos" || pathname.startsWith("/liga/documentos/")) {
    return "/liga/documentos";
  }
  if (pathnameCanon === "/liga/tesoreria" || pathname.startsWith("/liga/tesoreria/")) {
    return "/liga/tesoreria";
  }
  return null;
}
import { createSupabaseCookieHandlers } from "@/lib/supabase/auth-cookies";
import { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";
import {
  ACTIVE_LEAGUE_SLUG_COOKIE,
  activeLeagueSlugCookieOptions,
} from "@/lib/portal/active-league-cookie";
import { resolveLegacyRouteRedirect } from "@/lib/routing/legacy-route-redirects";

/** Alineado con `trailingSlash: true` en next.config: comparar rutas sin barra final redundante. */
function pathnameWithoutTrailingSlash(path: string): string {
  if (path === "/" || path === "") return "/";
  return path.replace(/\/+$/, "") || "/";
}

/** Propaga la ruta actual a Server Components (`headers().get("x-pathname")`). */
function nextWithPathname(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function isLigaOperationalPath(pathCanon: string, path: string): boolean {
  if (pathCanon === "/liga") return true;
  return path.startsWith("/liga/");
}

function masterEmailBypassActive(user: User, role: string | undefined): boolean {
  return isMasterSuperAdminUser(user) && role !== "SUPER_ADMIN";
}

/** Bloquea cuenta maestra si IP no está en allowlist (solo cuando env está configurado). */
function enforceMasterAdminIpOrRedirect(
  request: NextRequest,
  user: User,
  userRole: string | undefined,
  pathnameCanon: string,
  pathname: string,
): NextResponse | null {
  if (!isMasterSuperAdminUser(user)) return null;
  if (!isMasterAdminIpAllowlistConfigured()) return null;

  const clientIp = getClientIpFromRequest(request);
  if (isIpAllowedForMasterAdmin(clientIp, "enforce")) return null;

  const isProtected =
    isSuperAdminPath(pathnameCanon, pathname) ||
    isLigaOperationalPath(pathnameCanon, pathname) ||
    pathnameCanon === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  if (!isProtected) return null;

  logSecurityEvent(
    {
      type: "auth.route.forbidden",
      message: "IP no autorizada para cuenta maestra",
      userId: user.id,
      role: userRole,
      route: pathnameCanon,
      meta: { clientIp, reason: "master_admin_ip_allowlist" },
    },
    { level: "warn" },
  );

  const url = request.nextUrl.clone();
  url.pathname = "/login/";
  url.searchParams.set("auth_error", MASTER_ADMIN_IP_BLOCKED_CODE);
  return NextResponse.redirect(url);
}

const PROXY_RESERVED_SEGMENTS = new Set([
  "onboarding",
  "signup",
  "dashboard",
  "liga",
  "l",
  "api",
  "_next",
  "auth",
  "login",
  "register",
  "validar",
  "normativas",
  "busqueda-365",
  "torneos",
  "forgot-password",
  "galeria",
  "galeria-institucional",
  "ligas",
]);

/** Rutas públicas sin slug de club: no hace falta `getUser` (evita timeout a Supabase en cada GET /). */
function isPublicFastPath(pathnameCanon: string): boolean {
  if (pathnameCanon === "/") return true;
  const first = pathnameCanon.split("/").filter(Boolean)[0];
  if (!first) return true;
  return PROXY_RESERVED_SEGMENTS.has(first);
}

async function maybeRateLimitResponse(
  request: NextRequest,
  scope: "login" | "validar" | "busqueda365",
): Promise<NextResponse | null> {
  const clientIp = getClientIpFromHeaders(request.headers);
  const result = await checkRateLimit(scope, clientIp);
  if (result.allowed) return null;

  logRateLimitBlocked(scope, clientIp, result.retryAfterSec, request.nextUrl.pathname);
  const message = rateLimitExceededMessage(result.retryAfterSec);
  return new NextResponse(message, {
    status: 429,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Retry-After": String(result.retryAfterSec),
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Middleware de borde (Next.js 16+: `src/proxy.ts` sustituye a `middleware.ts`).
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameCanon = pathnameWithoutTrailingSlash(pathname);

  if (pathname.startsWith("/validar")) {
    const limited = await maybeRateLimitResponse(request, "validar");
    if (limited) return limited;
  }

  if (
    pathnameCanon === "/busqueda-365" ||
    pathname.startsWith("/busqueda-365/") ||
    /^\/l\/[^/]+\/busqueda-365\/?$/.test(pathname)
  ) {
    const limited = await maybeRateLimitResponse(request, "busqueda365");
    if (limited) return limited;
  }

  if (pathnameCanon === "/" && request.nextUrl.searchParams.has("l")) {
    const slug = request.nextUrl.searchParams.get("l")?.trim();
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/l/${slug}/`;
      url.search = "";
      return NextResponse.redirect(url, 301);
    }
  }

  const leaguePortalSlug = pathname.match(/^\/l\/([^/]+)/)?.[1]?.trim();
  if (leaguePortalSlug) {
    const response = nextWithPathname(request);
    response.cookies.set(ACTIVE_LEAGUE_SLUG_COOKIE, leaguePortalSlug, activeLeagueSlugCookieOptions);
    return response;
  }

  const isIntranetPath =
    pathnameCanon === "/dashboard" || pathnameCanon.startsWith("/dashboard/");
  const isLigaPath = isLigaOperationalPath(pathnameCanon, pathname);

  if (
    isPublicFastPath(pathnameCanon) &&
    !isLigaPath &&
    !isIntranetPath &&
    !pathname.startsWith("/auth/callback")
  ) {
    return nextWithPathname(request);
  }

  if (pathname.startsWith("/auth/callback")) {
    return nextWithPathname(request);
  }

  const legacyRedirect = resolveLegacyRouteRedirect(request);
  if (legacyRedirect) {
    const url = request.nextUrl.clone();
    url.pathname = legacyRedirect.pathname;
    return NextResponse.redirect(url, legacyRedirect.permanent ? 308 : 307);
  }

  const cookieHandlers = createSupabaseCookieHandlers(request, () => nextWithPathname(request));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieHandlers.cookies,
    },
  );

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error && isInvalidRefreshTokenError(error)) {
      await supabase.auth.signOut();
    } else {
      user = data.user;
    }
  } catch (err) {
    if (isInvalidRefreshTokenError(err)) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignorar */
      }
    }
  }

  const supabaseResponse = cookieHandlers.response;

  const userAppMetadata = (user?.app_metadata as {
    role?: string;
    club_slug?: string;
    league_id?: string;
    club_id?: string;
  }) || {};

  const userRole = userAppMetadata.role;
  const userClubId = userAppMetadata.club_id;

  if (user) {
    const ipBlock = enforceMasterAdminIpOrRedirect(
      request,
      user,
      userRole,
      pathnameCanon,
      pathname,
    );
    if (ipBlock) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignorar */
      }
      return ipBlock;
    }
  }

  if (isSuperAdminPath(pathnameCanon, pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/";
      return NextResponse.redirect(url);
    }
    if (!actsAsSuperAdminInProxy(user, userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = "/liga/";
      return NextResponse.redirect(url);
    }
  }

  if (pathnameCanon === "/liga/galeria-general" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/galeria-institucional/";
    return NextResponse.redirect(url);
  }

  const clubGaleriaMatch = pathname.match(/^\/liga\/clubs\/([^/]+)\/galeria\/?$/);
  if (clubGaleriaMatch && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/galeria/club/${clubGaleriaMatch[1]}/`;
    return NextResponse.redirect(url);
  }

  if (isLigaPath) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/";
      return NextResponse.redirect(url);
    }
    if (!canAccessIntranet(user, userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  const publicRoutes = [
    "/login",
    "/register",
    "/signup",
    "/onboarding",
    "/forgot-password",
    "/auth",
    "/normativas",
    "/busqueda-365",
    "/torneos",
    "/galeria",
    "/galeria-institucional",
    "/l/",
    "/ligas",
  ];
  const isPublicRoute =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname === "/" ||
    pathname.startsWith("/validar");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login/";
    return NextResponse.redirect(url);
  }

  if (user && !actsAsSuperAdminInProxy(user, userRole)) {
    const pathParts = pathname.split("/").filter(Boolean);
    const reservedPaths = [
      "onboarding",
      "signup",
      "dashboard",
      "liga",
      "api",
      "_next",
      "auth",
      "login",
      "register",
      "validar",
      "super-admin",
      "normativas",
      "busqueda-365",
      "torneos",
      "l",
      "galeria",
      "galeria-institucional",
      "ligas",
    ];
    const isClubRoute = pathParts.length > 0 && !reservedPaths.includes(pathParts[0]);

    if (isClubRoute) {
      const requestedClubSlug = pathParts[0];

      if (userClubId) {
        try {
          const { data: clubData } = await supabase
            .from("clubs")
            .select("id, slug, league_id")
            .eq("id", userClubId)
            .single();

          const jwtLeagueId = userAppMetadata.league_id?.trim();
          if (
            clubData &&
            jwtLeagueId &&
            clubData.league_id &&
            clubData.league_id !== jwtLeagueId
          ) {
            const url = request.nextUrl.clone();
            url.pathname = "/onboarding";
            return NextResponse.redirect(url);
          }

          if (clubData && clubData.slug !== requestedClubSlug) {
            const url = request.nextUrl.clone();
            url.pathname = pathname.replace(requestedClubSlug, clubData.slug);
            return NextResponse.redirect(url);
          } else if (!clubData) {
            const url = request.nextUrl.clone();
            url.pathname = "/login/";
            return NextResponse.redirect(url);
          }
        } catch {
          /* lookup de club falló; continuar sin redirigir por slug */
        }
      } else if (userRole === "CLUB_DELEGATE") {
        if (pathnameCanon !== "/onboarding") {
          const url = request.nextUrl.clone();
          url.pathname = "/onboarding";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  if (user && isPublicRoute && !pathname.startsWith("/auth/callback")) {
    const stayOnPublic =
      pathnameCanon === "/" ||
      pathnameCanon === "/login" ||
      pathname.startsWith("/login/") ||
      pathnameCanon === "/liga" ||
      pathnameCanon === "/normativas" ||
      pathnameCanon.startsWith("/normativas/") ||
      pathnameCanon === "/dashboard" ||
      pathnameCanon.startsWith("/dashboard/") ||
      pathnameCanon === "/busqueda-365" ||
      pathnameCanon.startsWith("/busqueda-365/") ||
      pathname.startsWith("/validar") ||
      pathname.startsWith("/galeria") ||
      pathname.startsWith("/galeria-institucional") ||
      pathname.startsWith("/l/") ||
      pathname.includes(".rsc");

    if (!stayOnPublic) {
      const url = request.nextUrl.clone();
      url.pathname = canAccessIntranet(user, userRole) ? "/liga/" : "/";
      return NextResponse.redirect(url);
    }
  }

  if (isIntranetPath) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/";
      return NextResponse.redirect(url);
    }
    if (!canAccessIntranet(user, userRole)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  const sensitiveRoute = resolveSensitiveRoute(pathnameCanon, pathname);
  if (sensitiveRoute && user) {
    logSensitiveRouteAllowed({
      route: sensitiveRoute,
      userId: user.id,
      role: userRole,
      leagueId: userAppMetadata.league_id,
      clubId: userClubId,
      clientIp: getClientIpFromHeaders(request.headers),
      bypassMasterEmail: masterEmailBypassActive(user, userRole),
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
