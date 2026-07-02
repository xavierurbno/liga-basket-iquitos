import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { canAccessIntranet, isMasterSuperAdminUser } from "@/lib/auth/intranet-gate";
import {
  isIpAllowedForMasterAdmin,
  isMasterAdminIpAllowlistConfigured,
  MASTER_ADMIN_IP_BLOCKED_CODE,
  resolveMasterAdminAuthErrorMessage,
} from "@/lib/auth/master-admin-ip-allowlist";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import { SiteTopNav } from "@/components/layout/SiteTopNav";
import { LoginForm } from "@/components/auth/LoginForm";
import { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";
import { StaleSessionCleanup } from "@/components/auth/StaleSessionCleanup";
import { resolveLoginPortalLeague } from "@/lib/portal/resolve-login-league";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";
import { PortalLeagueTheme } from "@/components/portal/PortalLeagueTheme";
import { brandingToCssVars } from "@/lib/leagues/league-branding";
import { resolveLoginHeroLogoUrl } from "@/lib/logos/public-league-logo";
import { getOAuthAllowedHosts } from "@/lib/security/oauth-redirect";
import { getPlatformName } from "@/lib/platform/platform-config";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ l?: string; next?: string; auth_error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { l: slug, next: nextParam, auth_error: authErrorParam } = await searchParams;
  const cookieStore = await cookies();

  const postLoginRedirect =
    typeof nextParam === "string" &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//")
      ? nextParam
      : null;

  let league = null;

  try {
    league = await resolveLoginPortalLeague({
      slugParam: slug,
      nextPath: postLoginRedirect,
    });
  } catch (err) {
    console.error("[login] Liga o ajustes no disponibles (BD o red):", err);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component: el proxy refresca sesión en rutas protegidas */
          }
        },
      },
    },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError && isInvalidRefreshTokenError(userError)) {
    await supabase.auth.signOut();
  }
  const user = userError && isInvalidRefreshTokenError(userError) ? null : userData.user;
  const role = typeof user?.app_metadata?.role === "string" ? user.app_metadata.role : undefined;

  const headerList = await headers();
  const clientIp = getClientIpFromHeaders(headerList);
  const masterIpBlocked =
    Boolean(user) &&
    isMasterSuperAdminUser(user) &&
    isMasterAdminIpAllowlistConfigured() &&
    !isIpAllowedForMasterAdmin(clientIp, "enforce-if-known");

  if (masterIpBlocked) {
    await supabase.auth.signOut();
  } else if (user && canAccessIntranet(user, role)) {
    redirect(postLoginRedirect ?? "/liga/");
  }

  const displayName = league?.name ?? getPlatformName();
  const heroLogoUrl = resolveLoginHeroLogoUrl(league);
  const loginNext =
    postLoginRedirect ?? (league?.slug ? leaguePortalHome(league.slug) : "/liga/");
  const themeStyle = league ? brandingToCssVars(league) : undefined;

  const requestHost =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? undefined;
  const oauthAllowedHosts = getOAuthAllowedHosts(requestHost);

  const authErrorMessage = masterIpBlocked
    ? resolveMasterAdminAuthErrorMessage(MASTER_ADMIN_IP_BLOCKED_CODE)
    : resolveMasterAdminAuthErrorMessage(authErrorParam);

  const content = (
    <div className="flex min-h-full flex-1 flex-col bg-[#F5F5F5]">
      <StaleSessionCleanup />
      <SiteTopNav
        leagueSlug={league?.slug}
        leagueName={league?.name}
        leagueLogoUrl={league?.logoUrl}
        leagueId={league?.leagueId}
      />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-[1000px] flex-col items-center space-y-8">
          <div className="w-full text-center">
            <div className="mb-8 flex justify-center animate-in fade-in zoom-in duration-700">
              {heroLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logo Supabase o public/
                <img
                  src={heroLogoUrl}
                  alt={`Logo ${displayName}`}
                  className="max-h-56 w-auto drop-shadow-2xl transition-all hover:scale-105"
                />
              ) : (
                <div
                  className="flex h-40 w-40 items-center justify-center rounded-2xl text-5xl font-black shadow-inner"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--portal-accent, #005CEE) 12%, white)",
                    color: "var(--portal-accent, #005CEE)",
                  }}
                  aria-hidden
                >
                  {(league?.name ?? displayName).trim().charAt(0).toUpperCase() || "L"}
                </div>
              )}
            </div>
            <h1
              className="portal-primary-text mx-auto max-w-[1000px] text-center text-3xl font-black uppercase leading-tight tracking-tighter md:text-5xl animate-in slide-in-from-bottom-2 duration-500"
              style={!league ? { color: "#1e3a5f" } : undefined}
            >
              {displayName}
            </h1>
            {league?.bannerText ? (
              <p className="mx-auto mt-4 max-w-xl text-sm font-medium italic text-slate-500">
                &ldquo;{league.bannerText}&rdquo;
              </p>
            ) : null}
          </div>

          <div className="w-full max-w-md rounded-[2.5rem] border-none bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-4 duration-700">
            <LoginForm
              initialLeagueSlug={league?.slug}
              postLoginRedirect={loginNext}
              oauthAllowedHosts={oauthAllowedHosts}
              authError={authErrorMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (league) {
    return (
      <PortalLeagueTheme branding={league} showBanner={false}>
        {content}
      </PortalLeagueTheme>
    );
  }

  return (
    <div
      className="portal-league-theme flex flex-1 flex-col"
      style={{
        "--portal-primary": "#1e3a5f",
        "--portal-accent": "#005CEE",
        ...themeStyle,
      } as CSSProperties}
    >
      {content}
    </div>
  );
}
