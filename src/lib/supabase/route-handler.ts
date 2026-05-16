import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Cliente Supabase para Route Handlers (p. ej. `/auth/callback/`).
 * Usa `request.cookies` (no `cookies()` de next/headers) para que Set-Cookie
 * viaje en la misma respuesta de redirección en Vercel/Edge.
 */
export function createSupabaseRouteHandlerClient(request: NextRequest, redirectTo: string) {
  let response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.redirect(redirectTo);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, response };
}
