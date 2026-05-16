import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseCookieHandlers, type SupabaseCookieJar } from "@/lib/supabase/auth-cookies";

/**
 * Cliente Supabase para Route Handlers (`/auth/callback/`).
 * Acumula cookies fragmentadas con opciones completas en la redirección 303.
 */
export function createSupabaseRouteHandlerClient(request: NextRequest, redirectTo: string) {
  const handlers = createSupabaseCookieHandlers(request, () =>
    NextResponse.redirect(redirectTo, { status: 303 }),
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: handlers.cookies,
    },
  );

  return {
    supabase,
    jar: handlers.jar,
    getResponse: () => handlers.response,
  };
}

export type { SupabaseCookieJar };
