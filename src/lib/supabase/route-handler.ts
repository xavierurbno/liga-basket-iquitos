import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applySetAllCookies } from "@/lib/supabase/auth-cookies";

/**
 * Cliente Supabase para Route Handlers (`/auth/callback/`).
 * Usa `request.cookies` y conserva todos los fragmentos `sb-*-auth-token.*` en la redirección.
 */
export function createSupabaseRouteHandlerClient(request: NextRequest, redirectTo: string) {
  let response = NextResponse.redirect(redirectTo, { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          response = applySetAllCookies(
            response,
            request,
            () => NextResponse.redirect(redirectTo, { status: 303 }),
            cookiesToSet,
            cacheHeaders,
          );
        },
      },
    },
  );

  return { supabase, response };
}
