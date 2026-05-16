import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const DEFAULT_POST_LOGIN = "/liga/";

/** Solo rutas relativas internas (evita open-redirect). */
function safeInternalNext(raw: string | null): string {
  if (!raw || typeof raw !== "string") return DEFAULT_POST_LOGIN;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return DEFAULT_POST_LOGIN;
  return t;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalNext(searchParams.get("next"));

  console.log("[DEBUG CALLBACK] Inicio — code presente:", Boolean(code), "next:", next);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have proxy (or middleware) refreshing
              // user sessions.
            }
          },
        },
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    const session = data.session;
    console.log(
      "[DEBUG CALLBACK] Email del usuario intentando entrar:",
      session?.user?.email ?? data.user?.email,
    );

    if (!error) {
      console.log("[DEBUG CALLBACK] exchangeCodeForSession OK — redirigiendo a:", next);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[DEBUG CALLBACK] ERROR REAL EN EL CALLBACK:", error);
  } else {
    console.warn("[DEBUG CALLBACK] Sin parámetro ?code= en la URL del callback");
  }

  console.log("[DEBUG CALLBACK] Redirigiendo a /login (fallo o sin código)");
  return NextResponse.redirect(`${origin}/login`);
}
