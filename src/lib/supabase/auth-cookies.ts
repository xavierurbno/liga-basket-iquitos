import type { NextRequest, NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

const isProduction = process.env.NODE_ENV === "production";

/** Opciones seguras para HTTPS (Vercel) sin pisar lo que envía Supabase. */
export function mergeAuthCookieOptions(options?: CookieOptions): CookieOptions {
  return {
    ...options,
    path: options?.path ?? "/",
    sameSite: (options?.sameSite as CookieOptions["sameSite"]) ?? "lax",
    secure: options?.secure ?? isProduction,
    httpOnly: options?.httpOnly ?? true,
  };
}

export function isSupabaseAuthCookieName(name: string): boolean {
  return name.includes("sb-") || name.includes("auth-token") || name.includes("code-verifier");
}

type RecreateResponse = () => NextResponse;

function applyCacheHeaders(response: NextResponse, cacheHeaders: Record<string, string>) {
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

type CookieEntry = { name: string; value: string; options?: CookieOptions };

/**
 * Acumula cookies entre varias llamadas a `setAll` conservando opciones (httpOnly, secure…).
 * Recrear `NextResponse` solo con `cookies.getAll()` pierde opciones y rompe `getUser()` en /liga.
 */
export class SupabaseCookieJar {
  private readonly jar = new Map<string, CookieEntry>();

  constructor(
    private readonly request: NextRequest,
    private readonly recreateResponse: RecreateResponse,
  ) {}

  applySetAll(
    cookiesToSet: CookieEntry[],
    cacheHeaders: Record<string, string> = {},
  ): NextResponse {
    cookiesToSet.forEach(({ name, value, options }) => {
      this.request.cookies.set(name, value);
      const maxAge = options?.maxAge;
      if (!value || maxAge === 0) {
        this.jar.delete(name);
      } else {
        this.jar.set(name, { name, value, options });
      }
    });

    const response = this.recreateResponse();
    this.jar.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, mergeAuthCookieOptions(options));
    });
    applyCacheHeaders(response, cacheHeaders);
    return response;
  }

  copyAuthCookiesTo(target: NextResponse) {
    this.jar.forEach(({ name, value, options }) => {
      if (isSupabaseAuthCookieName(name)) {
        target.cookies.set(name, value, mergeAuthCookieOptions(options));
      }
    });
    applyCacheHeaders(target, {
      "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
      Expires: "0",
      Pragma: "no-cache",
    });
  }

  getAuthCookieNames(): string[] {
    return [...this.jar.keys()].filter(isSupabaseAuthCookieName);
  }
}

export function createSupabaseCookieHandlers(
  request: NextRequest,
  recreateResponse: RecreateResponse,
) {
  const jar = new SupabaseCookieJar(request, recreateResponse);
  let response = recreateResponse();

  return {
    jar,
    get response() {
      return response;
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieEntry[], cacheHeaders: Record<string, string> = {}) {
        response = jar.applySetAll(cookiesToSet, cacheHeaders);
      },
    },
  };
}
