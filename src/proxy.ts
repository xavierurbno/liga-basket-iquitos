import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  actsAsSuperAdminInProxy,
  canAccessIntranet,
} from "@/lib/auth/intranet-gate";

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
 * Borde único (Next.js 16+): sustituye a `middleware.ts`.
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameCanon = pathnameWithoutTrailingSlash(pathname);

  console.log("[DEBUG MIDDLEWARE] Evaluando ruta:", request.nextUrl.pathname);

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

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("[proxy] auth getUser:", error);
  }

  console.log("[DEBUG MIDDLEWARE] ¿Tiene sesión activa?:", !!user);

  const userAppMetadata = (user?.app_metadata as {
    role?: string;
    club_slug?: string;
    league_id?: string;
    club_id?: string;
  }) || {};

  const userRole = userAppMetadata.role;
  const userClubId = userAppMetadata.club_id;

  if (isLigaOperationalPath(pathnameCanon, pathname)) {
    if (!user) {
      console.log(
        "[DEBUG MIDDLEWARE] Redirect → /login | razón: ruta /liga/* sin usuario (sesión/cookies no visibles en proxy)",
      );
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (!canAccessIntranet(user, userRole)) {
      console.log(
        "[DEBUG MIDDLEWARE] Redirect → / | razón: intranet denegada (rol JWT:",
        userRole ?? "(vacío)",
        "| email:",
        user.email ?? "(sin email)",
        "| no cumple INTRANET_LIGA_ROLES ni correo maestro)",
      );
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  const publicRoutes = ["/login", "/register", "/forgot-password", "/auth", "/normativas", "/busqueda-365"];
  const isPublicRoute =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname === "/" ||
    pathname.startsWith("/validar");

  if (!user && !isPublicRoute) {
    console.log(
      "[DEBUG MIDDLEWARE] Redirect → /login | razón: sin sesión en ruta protegida",
      pathname,
      "(no es ruta pública)",
    );
    const url = request.nextUrl.clone();
    url.pathname = "/login";
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
            console.log(
              "[DEBUG MIDDLEWARE] Redirect → /login | razón: club_id en JWT no existe en tabla clubs",
              userClubId,
            );
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
          }
        } catch (err) {
          console.error("[proxy] Club lookup:", err);
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
      console.log(
        "[DEBUG MIDDLEWARE] Redirect → /login | razón: /dashboard/* sin sesión",
      );
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (!canAccessIntranet(user, userRole)) {
      console.log(
        "[DEBUG MIDDLEWARE] Redirect → / | razón: /dashboard/* sin rol intranet (rol:",
        userRole ?? "(vacío)",
        "| email:",
        user.email ?? "(sin email)",
        ")",
      );
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
