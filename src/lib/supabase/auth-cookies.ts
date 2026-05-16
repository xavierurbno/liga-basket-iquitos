import type { NextRequest, NextResponse } from "next/server";
import { serializeCookieHeader, type CookieOptions } from "@supabase/ssr";

const isProduction = process.env.NODE_ENV === "production";

/** Opciones seguras para HTTPS (Vercel) sin pisar lo que envía Supabase. */
export function mergeAuthCookieOptions(options?: CookieOptions): CookieOptions {
  return {
    ...options,
    path: options?.path ?? "/",
    sameSite: (options?.sameSite as CookieOptions["sameSite"]) ?? "lax",
    secure: options?.secure ?? isProduction,
  };
}

export function isSupabaseAuthCookieName(name: string): boolean {
  return name.includes("sb-") || name.includes("auth-token") || name.includes("code-verifier");
}

export function listAuthCookieNames(request: NextRequest): string[] {
  return request.cookies.getAll().filter((c) => isSupabaseAuthCookieName(c.name)).map((c) => c.name);
}

type RecreateResponse = () => NextResponse;

function applyCacheHeaders(response: NextResponse, cacheHeaders: Record<string, string>) {
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

/**
 * Supabase llama `setAll(cookies, cacheHeaders)` varias veces (cookies fragmentadas).
 * Hay que conservar fragmentos previos y aplicar Cache-Control (obligatorio en CDN/Vercel).
 */
export function applySetAllCookies(
  response: NextResponse,
  request: NextRequest,
  recreateResponse: RecreateResponse,
  cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
  cacheHeaders: Record<string, string> = {},
): NextResponse {
  const preserved = response.cookies.getAll();

  cookiesToSet.forEach(({ name, value }) => {
    request.cookies.set(name, value);
  });

  const next = recreateResponse();

  preserved.forEach((cookie) => {
    next.cookies.set(cookie.name, cookie.value);
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    const merged = mergeAuthCookieOptions(options);
    next.cookies.set(name, value, merged);
    // Refuerzo en Edge: algunos runtimes pierden cookies si solo usan .cookies.set
    next.headers.append("Set-Cookie", serializeCookieHeader(name, value, merged));
  });

  applyCacheHeaders(next, cacheHeaders);

  return next;
}

export function copySupabaseAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    if (isSupabaseAuthCookieName(cookie.name)) {
      const merged = mergeAuthCookieOptions();
      to.cookies.set(cookie.name, cookie.value, merged);
      to.headers.append("Set-Cookie", serializeCookieHeader(cookie.name, cookie.value, merged));
    }
  });
  applyCacheHeaders(to, {
    "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
    Expires: "0",
    Pragma: "no-cache",
  });
}

export function logDebugAuth(
  scope: "proxy" | "callback",
  message: string,
  payload?: Record<string, unknown>,
) {
  console.log(`[DEBUG AUTH] [${scope}] ${message}`, payload ?? "");
}
