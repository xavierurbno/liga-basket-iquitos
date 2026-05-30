import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase SSR con cookies de Next (Server Actions, RSC, layouts).
 * Nombre canónico Fase 2; `createSupabaseServerClient` se mantiene como alias.
 */
export async function createSupabaseServerFromCookies() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* En Server Components el set puede fallar; el proxy refresca la sesión. */
          }
        },
      },
    },
  );
}

/** @deprecated Usar `createSupabaseServerFromCookies`. */
export const createSupabaseServerClient = createSupabaseServerFromCookies;
