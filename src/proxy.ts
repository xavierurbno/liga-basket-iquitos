import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  actsAsSuperAdminInProxy,
  canAccessIntranet,
} from "@/lib/auth/intranet-gate";

function isSuperAdminPath(pathnameCanon: string, pathname: string): boolean {
  return pathnameCanon === "/super-admin" || pathname.startsWith("/super-admin/");
}
import { createSupabaseCookieHandlers } from "@/lib/supabase/auth-cookies";

/** Alineado con `trailingSlash: true` en next.config: comparar rutas sin barra final redundante. */
function pathnameWithoutTrailingSlash(path: string): string {
  if (path === "/" || path === "") return "/";
  return path.replace(/\/+$/, "") || "/";
}

function isLigaOperationalPath(pathCanon: string, path: string): boolean {
  if (pathCanon === "/liga") return true;
  return path.startsWith("/liga/");
}

const PROXY_RESERVED_SEGMENTS = new Set([
  "onboarding",
  "dashboard",
  "liga",
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
]);

/** Rutas públicas sin slug de club: no hace falta `getUser` (evita timeout a Supabase en cada GET /). */
function isPublicFastPath(pathnameCanon: string): boolean {
  if (pathnameCanon === "/") return true;
  const first = pathnameCanon.split("/").filter(Boolean)[0];
  if (!first) return true;
  return PROXY_RESERVED_SEGMENTS.has(first);
}

/**
 * Middleware de borde (Next.js 16+: `src/proxy.ts` sustituye a `middleware.ts`).
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameCanon = pathnameWithoutTrailingSlash(pathname);

  const isIntranetPath =
    pathnameCanon === "/dashboard" || pathnameCanon.startsWith("/dashboard/");
  const isLigaPath = isLigaOperationalPath(pathnameCanon, pathname);

  if (
    isPublicFastPath(pathnameCanon) &&
    !isLigaPath &&
    !isIntranetPath &&
    !pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  if (
    pathnameCanon === "/liga/busqueda-365" ||
    pathname.startsWith("/liga/busqueda-365/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/busqueda-365";
    return NextResponse.redirect(url);
  }

  if (pathnameCanon === "/dashboard/normativas" || pathname.startsWith("/dashboard/normativas/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/normativas/";
    return NextResponse.redirect(url);
  }

  const cookieHandlers = createSupabaseCookieHandlers(request, () =>
    NextResponse.next({ request: { headers: request.headers } }),
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieHandlers.cookies,
    },
  );

  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    /* getUser falló; se trata como sin sesión */
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
    "/forgot-password",
    "/auth",
    "/normativas",
    "/busqueda-365",
    "/torneos",
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
    ];
    const isClubRoute = pathParts.length > 0 && !reservedPaths.includes(pathParts[0]);

    if (isClubRoute) {
      const requestedClubSlug = pathParts[0];

      if (userClubId) {
        try {
          const { data: clubData } = await supabase
            .from("clubs")
            .select("id, slug")
            .eq("id", userClubId)
            .single();

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
      } else if (userRole === "CLUB_DELEGATE" || userRole === "LEAGUE_ADMIN") {
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

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
