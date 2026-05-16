import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "@supabase/supabase-js";
import { canAccessIntranet } from "@/lib/auth/intranet-gate";
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
  return NextResponse.redirect(url);
}

function copySupabaseAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    if (cookie.name.includes("sb-")) {
      to.cookies.set(cookie.name, cookie.value);
    }
  });
}

async function syncUserProfileAfterOAuth(session: Session | null): Promise<void> {
  if (!session?.user?.id) return;
  void session.user.email;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const next = safeInternalNext(searchParams.get("next"));

  if (oauthError) {
    return loginRedirectUrl(origin, oauthErrorDescription ?? oauthError);
  }

  if (!code) {
    return loginRedirectUrl(origin, "missing_code");
  }

  const pkcePresent = request.cookies
    .getAll()
    .some((c) => c.name.includes("code-verifier") || c.name.includes("pkce"));

  try {
    const successRedirectTarget = `${origin}${next}`;
    const { supabase, response } = createSupabaseRouteHandlerClient(
      request,
      successRedirectTarget,
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession:", error.message, { pkcePresent });
      return loginRedirectUrl(origin, error.message);
    }

    const session = data.session;
    if (!session) {
      return loginRedirectUrl(origin, "empty_session");
    }

    try {
      await syncUserProfileAfterOAuth(session);
    } catch (dbError) {
      console.error("[auth/callback] sync profile:", dbError);
    }

    const role =
      typeof session.user.app_metadata?.role === "string"
        ? session.user.app_metadata.role
        : undefined;

    if (!canAccessIntranet(session.user, role)) {
      const home = NextResponse.redirect(`${origin}/`);
      copySupabaseAuthCookies(response, home);
      return home;
    }

    return response;
  } catch (generalError) {
    console.error("[auth/callback] critical:", generalError);
    return loginRedirectUrl(
      origin,
      generalError instanceof Error ? generalError.message : "callback_failed",
    );
  }
}
