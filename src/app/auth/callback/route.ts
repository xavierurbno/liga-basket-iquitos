import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessIntranet } from "@/lib/auth/intranet-gate";

export const dynamic = "force-dynamic";

const DEFAULT_POST_LOGIN = "/liga/";

function logDebugAuth(message: string, payload?: Record<string, unknown>) {
  console.log(`[DEBUG AUTH] [callback] ${message}`, payload ?? "");
}

function safeInternalNext(raw: string | null): string {
  if (!raw || typeof raw !== "string") return DEFAULT_POST_LOGIN;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return DEFAULT_POST_LOGIN;
  return t;
}

function loginRedirect(origin: string, reason?: string) {
  const base = `${origin}/login/`;
  const url = reason
    ? `${base}?auth_error=${encodeURIComponent(reason.slice(0, 200))}`
    : base;
  return NextResponse.redirect(url, { status: 303 });
}

function authCookieNames(store: Awaited<ReturnType<typeof cookies>>) {
  return store
    .getAll()
    .filter((c) => c.name.includes("sb-") || c.name.includes("auth-token"))
    .map((c) => c.name);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const next = safeInternalNext(searchParams.get("next"));

  logDebugAuth("Inicio", {
    pathname: requestUrl.pathname,
    hasCode: Boolean(code),
    codeLength: code?.length ?? 0,
    next,
    origin,
    requestCookieCount: request.cookies.getAll().length,
  });

  if (oauthError) {
    logDebugAuth("Error OAuth en query", { oauthError, oauthErrorDescription });
    return loginRedirect(origin, oauthErrorDescription ?? oauthError);
  }

  if (!code) {
    logDebugAuth("Código OAuth ausente (?code= no presente)");
    return loginRedirect(origin, "missing_code");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    logDebugAuth("Variables Supabase faltantes en el entorno", {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
    });
    return loginRedirect(origin, "missing_supabase_env");
  }

  const cookieStore = await cookies();
  const pkceBefore = cookieStore
    .getAll()
    .some((c) => c.name.includes("code-verifier") || c.name.includes("pkce"));

  logDebugAuth("PKCE en cookieStore antes del exchange", {
    pkceBefore,
    cookiesAntes: authCookieNames(cookieStore),
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
          logDebugAuth("setAll → cookieStore nativo", {
            count: cookiesToSet.length,
            names: cookiesToSet.map((c) => c.name),
            storeDespues: authCookieNames(cookieStore),
          });
        } catch (setError) {
          logDebugAuth("setAll falló al escribir en cookieStore", {
            error: setError instanceof Error ? setError.message : String(setError),
            intento: cookiesToSet.map((c) => c.name),
          });
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logDebugAuth("exchangeCodeForSession FALLÓ", {
      message: error.message,
      status: error.status,
      pkceBefore,
      cookiesTrasFallo: authCookieNames(cookieStore),
    });
    return loginRedirect(origin, error.message);
  }

  const session = data.session;
  const user = session?.user ?? data.user ?? null;

  logDebugAuth("exchangeCodeForSession OK", {
    email: user?.email ?? null,
    userId: user?.id ?? null,
    cookiesEnStore: authCookieNames(cookieStore),
    tieneAccessToken: authCookieNames(cookieStore).some(
      (n) => n.includes("auth-token") && !n.includes("code-verifier"),
    ),
  });

  if (!session || !user) {
    logDebugAuth("Sesión vacía tras exchange");
    return loginRedirect(origin, "empty_session");
  }

  const role =
    typeof user.app_metadata?.role === "string" ? user.app_metadata.role : undefined;
  const intranetOk = canAccessIntranet(user, role);

  logDebugAuth("Destino tras login", {
    role: role ?? null,
    intranetOk,
    next,
  });

  const redirectPath = intranetOk ? next : "/";
  const redirectUrl = `${origin}${redirectPath}`;

  logDebugAuth("NextResponse.redirect limpio (cookies en cookieStore de Next.js)", {
    redirectUrl,
    cookiesQueViajan: authCookieNames(cookieStore),
  });

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
