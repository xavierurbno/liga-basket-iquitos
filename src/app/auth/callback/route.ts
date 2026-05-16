import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessIntranet } from "@/lib/auth/intranet-gate";

export const dynamic = "force-dynamic";

const DEFAULT_POST_LOGIN = "/liga/";

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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const next = safeInternalNext(searchParams.get("next"));

  if (oauthError) {
    return loginRedirect(origin, oauthErrorDescription ?? oauthError);
  }

  if (!code) {
    return loginRedirect(origin, "missing_code");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    return loginRedirect(origin, "missing_supabase_env");
  }

  const cookieStore = await cookies();

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
        } catch {
          /* Route Handler: set puede fallar si la respuesta ya se envió */
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return loginRedirect(origin, error.message);
  }

  const session = data.session;
  const user = session?.user ?? data.user ?? null;

  if (!session || !user) {
    return loginRedirect(origin, "empty_session");
  }

  const role =
    typeof user.app_metadata?.role === "string" ? user.app_metadata.role : undefined;
  const intranetOk = canAccessIntranet(user, role);

  const redirectPath = intranetOk ? next : "/";
  const redirectUrl = `${origin}${redirectPath}`;

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
