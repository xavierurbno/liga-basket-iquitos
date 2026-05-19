import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { canAccessIntranet } from "@/lib/auth/intranet-gate";
import { SiteTopNav } from "@/components/layout/SiteTopNav";
import { LoginForm } from "@/components/auth/LoginForm";
import { MasterClockCounter } from "@/components/system/MasterClockCounter";
import { leagueRepository } from "@/repositories/league.repository";
import { settingsRepository } from "@/repositories/settingsRepository";
import type { LeagueSettings } from "@/lib/db/schema";
import { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";
import { StaleSessionCleanup } from "@/components/auth/StaleSessionCleanup";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ l?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { l: slug, next: nextParam } = await searchParams;
  const cookieStore = await cookies();

  let league: { id: string; name: string; slug: string } | null = null;
  let settings: LeagueSettings | null = null;

  try {
    if (slug) {
      league = await leagueRepository.findBySlug(slug);
    }
    if (!league) {
      const allLeagues = await leagueRepository.findAll();
      league =
        allLeagues.find((l) => l.slug === "iquitos" || l.slug.includes("iquitos")) ||
        allLeagues[0] ||
        null;
    }
    if (league) {
      settings = await settingsRepository.getLeagueSettings(league.id);
    }
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
    }
  );

  const postLoginRedirect =
    typeof nextParam === "string" &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//")
      ? nextParam
      : null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError && isInvalidRefreshTokenError(userError)) {
    await supabase.auth.signOut();
  }
  const user = userError && isInvalidRefreshTokenError(userError) ? null : userData.user;
  const role = typeof user?.app_metadata?.role === "string" ? user.app_metadata.role : undefined;
  if (user && canAccessIntranet(user, role)) {
    redirect(postLoginRedirect ?? "/liga/");
  }

  // Identidad Visual
  const displayLogo = settings?.loginLogoUrl || "/logo-liga.png";
  const displayName = league?.name || "Liga de Basket de Iquitos";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#F5F5F5]">
      <StaleSessionCleanup />
      <SiteTopNav />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-[1000px] flex-col items-center space-y-8">
        <MasterClockCounter />

        <div className="w-full text-center">
          <div className="mb-8 flex justify-center animate-in fade-in zoom-in duration-700">
            <img
              src={displayLogo}
              alt={`Logo ${displayName}`}
              className="max-h-56 w-auto drop-shadow-2xl transition-all hover:scale-105"
            />
          </div>
          <h1 className="mx-auto max-w-[1000px] text-center text-3xl font-black uppercase leading-tight tracking-tighter text-[#1e3a5f] md:text-5xl animate-in slide-in-from-bottom-2 duration-500">
            {displayName}
          </h1>
          {settings?.bannerText && (
            <p className="mt-4 text-slate-500 font-medium max-w-xl mx-auto italic">
              "{settings.bannerText}"
            </p>
          )}
        </div>

        <div className="w-full max-w-md rounded-[2.5rem] border-none bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-4 duration-700">
          <LoginForm
            initialLeagueSlug={league?.slug}
            postLoginRedirect={postLoginRedirect ?? "/liga/"}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
