import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "@supabase/supabase-js";
import { canAccessIntranet } from "@/lib/auth/intranet-gate";
import {
  copySupabaseAuthCookies,
  listAuthCookieNames,
  logDebugAuth,
} from "@/lib/supabase/auth-cookies";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export const dynamic = "force-dynamic";

const DEFAULT_POST_LOGIN = "/liga/";

function safeInternalNext(raw: string | null): string {
  if (!raw || typeof raw !== "string") return DEFAULT_POST_LOGIN;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return DEFAULT_POST_LOGIN;
  return t;
}

function loginRedirectUrl(origin: string, reason?: string): NextResponse {
  const base = `${origin}/login/`;
  const url = reason
    ? `${base}?auth_error=${encodeURIComponent(reason.slice(0, 200))}`
    : base;
  return NextResponse.redirect(url, { status: 303 });
}

async function syncUserProfileAfterOAuth(session: Session | null): Promise<void> {
  if (!session?.user?.id) return;
  void session.user.email;
}

function logEnvSanity() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).hostname : null;
  } catch {
    urlHost = "invalid-url";
  }
  logDebugAuth("callback", "Variables de entorno (sanidad)", {
    hasSupabaseUrl: Boolean(url),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    urlHost,
    nodeEnv: process.env.NODE_ENV,
  });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const next = safeInternalNext(searchParams.get("next"));

  logEnvSanity();
  logDebugAuth("callback", "Inicio OAuth callback", {
    pathname: requestUrl.pathname,
    hasCode: Boolean(code),
    codeLength: code?.length ?? 0,
    next,
    origin,
    incomingAuthCookies: listAuthCookieNames(request),
  });

  if (oauthError) {
    logDebugAuth("callback", "Error OAuth en query", {
      oauthError,
      oauthErrorDescription,
    });
    return loginRedirectUrl(origin, oauthErrorDescription ?? oauthError);
  }

  if (!code) {
    logDebugAuth("callback", "Sin parámetro ?code= en la URL");
    return loginRedirectUrl(origin, "missing_code");
  }

  const pkcePresent = request.cookies
    .getAll()
    .some((c) => c.name.includes("code-verifier") || c.name.includes("pkce"));

  logDebugAuth("callback", "PKCE antes de exchange", { pkcePresent });

  try {
    const successRedirectTarget = `${origin}${next}`;
    const { supabase, response } = createSupabaseRouteHandlerClient(
      request,
      successRedirectTarget,
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logDebugAuth("callback", "exchangeCodeForSession FALLÓ", {
        message: error.message,
        status: error.status,
        pkcePresent,
      });
      return loginRedirectUrl(origin, error.message);
    }

    const session = data.session;
    logDebugAuth("callback", "exchangeCodeForSession OK", {
      email: session?.user?.email ?? data.user?.email ?? null,
      userId: session?.user?.id ?? null,
      responseAuthCookies: response.cookies
        .getAll()
        .filter((c) => c.name.includes("sb-") || c.name.includes("auth-token"))
        .map((c) => c.name),
    });

    if (!session) {
      logDebugAuth("callback", "Sesión vacía tras exchange");
      return loginRedirectUrl(origin, "empty_session");
    }

    try {
      await syncUserProfileAfterOAuth(session);
    } catch (dbError) {
      console.error("[DEBUG AUTH] [callback] sync profile:", dbError);
    }

    const role =
      typeof session.user.app_metadata?.role === "string"
        ? session.user.app_metadata.role
        : undefined;

    const intranetOk = canAccessIntranet(session.user, role);
    logDebugAuth("callback", "Acceso intranet", { role: role ?? null, intranetOk });

    if (!intranetOk) {
      const home = NextResponse.redirect(`${origin}/`, { status: 303 });
      copySupabaseAuthCookies(response, home);
      logDebugAuth("callback", "Redirigiendo a / (sin rol intranet)", {
        homeAuthCookies: home.cookies
          .getAll()
          .filter((c) => c.name.includes("sb-"))
          .map((c) => c.name),
      });
      return home;
    }

    logDebugAuth("callback", "Redirigiendo a intranet", {
      target: successRedirectTarget,
      responseAuthCookies: response.cookies
        .getAll()
        .filter((c) => c.name.includes("sb-"))
        .map((c) => c.name),
    });

    return response;
  } catch (generalError) {
    logDebugAuth("callback", "Excepción crítica", {
      error: generalError instanceof Error ? generalError.message : String(generalError),
    });
    return loginRedirectUrl(
      origin,
      generalError instanceof Error ? generalError.message : "callback_failed",
    );
  }
}
