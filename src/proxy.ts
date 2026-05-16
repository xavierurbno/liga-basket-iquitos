import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  actsAsSuperAdminInProxy,
  canAccessIntranet,
} from "@/lib/auth/intranet-gate";
import {
  createSupabaseCookieHandlers,
  getSupabaseProjectRefFromCookies,
  getSupabaseProjectRefFromEnv,
  listAuthCookieNames,
  logDebugAuth,
} from "@/lib/supabase/auth-cookies";

/** Alineado con `trailingSlash: true` en next.config: comparar rutas sin barra final redundante. */
function pathnameWithoutTrailingSlash(path: string): string {
  if (path === "/" || path === "") return "/";
  return path.replace(/\/+$/, "") || "/";
}

function isLigaOperationalPath(pathCanon: string, path: string): boolean {
  if (pathCanon === "/liga") return true;
  return path.startsWith("/liga/");
}

/**
 * Middleware de borde (Next.js 16+: `src/proxy.ts` sustituye a `middleware.ts`).
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameCanon = pathnameWithoutTrailingSlash(pathname);

  // OAuth: el Route Handler intercambia ?code=; no refrescar sesión aquí.
  if (pathname.startsWith("/auth/callback")) {
    logDebugAuth("proxy", "Passthrough callback (sin getUser)", {
      pathname,
      incomingAuthCookies: listAuthCookieNames(request),
    });
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

  const authCookiesOnRequest = listAuthCookieNames(request);
  const isLigaPath = isLigaOperationalPath(pathnameCanon, pathname);

  if (isLigaPath) {
    logDebugAuth("proxy", "Petición a /liga/* — cookies entrantes", {
      pathname,
      cookieCount: authCookiesOnRequest.length,
      cookieNames: authCookiesOnRequest,
      hasSbAccessToken: authCookiesOnRequest.some(
        (n) => n.includes("auth-token") && !n.includes("code-verifier"),
      ),
    });
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
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    if (error) {
      logDebugAuth("proxy", "getUser devolvió error", {
        pathname,
        message: error.message,
        status: error.status,
        name: error.name,
        cookieCount: authCookiesOnRequest.length,
        cookieNames: authCookiesOnRequest,
        envProjectRef: getSupabaseProjectRefFromEnv(),
        cookieProjectRef: getSupabaseProjectRefFromCookies(request),
        projectRefMatch:
          getSupabaseProjectRefFromEnv() === getSupabaseProjectRefFromCookies(request),
      });
    }
  } catch (error) {
    console.error("[DEBUG AUTH] [proxy] getUser excepción:", error);
  }

  const supabaseResponse = cookieHandlers.response;

  logDebugAuth("proxy", "Resultado getUser", {
    pathname,
    hasUser: Boolean(user),
    email: user?.email ?? null,
    incomingAuthCookies: authCookiesOnRequest,
    authTokenChunkCount: authCookiesOnRequest.filter((n) => n.includes("auth-token")).length,
    envProjectRef: getSupabaseProjectRefFromEnv(),
    cookieProjectRef: getSupabaseProjectRefFromCookies(request),
    responseSetCookieCount: supabaseResponse.cookies.getAll().length,
  });

  const userAppMetadata = (user?.app_metadata as {
    role?: string;
    club_slug?: string;
    league_id?: string;
    club_id?: string;
  }) || {};

  const userRole = userAppMetadata.role;
  const userClubId = userAppMetadata.club_id;

  if (isLigaPath) {
    if (!user) {
      logDebugAuth("proxy", "307 → /login/ (sin usuario en /liga/*)", {
        cookieNames: authCookiesOnRequest,
        authTokenChunkCount: authCookiesOnRequest.filter((n) => n.includes("auth-token")).length,
        envProjectRef: getSupabaseProjectRefFromEnv(),
        cookieProjectRef: getSupabaseProjectRefFromCookies(request),
        projectRefMatch:
          getSupabaseProjectRefFromEnv() === getSupabaseProjectRefFromCookies(request),
        hint: "Cookies presentes pero getUser=false: revisa ANON_KEY en Vercel, fragmentos .0/.1, o projectRefMatch=false",
      });
      const url = request.nextUrl.clone();
      url.pathname = "/login/";
      return NextResponse.redirect(url);
    }
    if (!canAccessIntranet(user, userRole)) {
      logDebugAuth("proxy", "Redirect → / (sin rol intranet)", {
        role: userRole ?? null,
        email: user.email,
      });
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    logDebugAuth("proxy", "Acceso /liga/* permitido", {
      email: user.email,
      role: userRole ?? null,
    });
  }

  const publicRoutes = ["/login", "/register", "/forgot-password", "/auth", "/normativas", "/busqueda-365"];
  const isPublicRoute =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname === "/" ||
    pathname.startsWith("/validar");

  if (!user && !isPublicRoute) {
    logDebugAuth("proxy", "307 → /login/ (ruta protegida sin sesión)", { pathname });
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
            logDebugAuth("proxy", "307 → /login/ (club_id JWT inválido)", { userClubId });
            const url = request.nextUrl.clone();
            url.pathname = "/login/";
            return NextResponse.redirect(url);
          }
        } catch (err) {
          console.error("[DEBUG AUTH] [proxy] Club lookup:", err);
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

  const isIntranetPath =
    pathnameCanon === "/dashboard" || pathnameCanon.startsWith("/dashboard/");
  if (isIntranetPath) {
    if (!user) {
      logDebugAuth("proxy", "307 → /login/ (/dashboard/* sin sesión)", { pathname });
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
