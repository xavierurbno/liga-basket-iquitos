import { Suspense } from "react";
import { SiteTopNav } from "@/components/layout/SiteTopNav";
import { DynamicClubGalleries } from "@/components/gallery/DynamicClubGalleries";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { SponsorFooter } from "@/components/layout/SponsorFooter";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { PublicPortalCarouselSection } from "@/components/portal/PublicPortalCarouselSection";
import { PublicPortalTournamentsAsync } from "@/components/portal/PublicPortalTournamentsAsync";
import { PublicTournamentsSkeleton } from "@/components/portal/PublicTournamentsSkeleton";
import type { LeaguePortalBranding } from "@/lib/leagues/league-branding";
import { PortalLeagueTheme } from "@/components/portal/PortalLeagueTheme";

function CarouselSkeleton() {
  return (
    <section className="mt-3 shrink-0 animate-pulse" aria-hidden>
      <div className="aspect-16/7 w-full rounded-2xl bg-slate-200" />
    </section>
  );
}

function FooterSkeleton() {
  return <footer className="mt-auto h-24 w-full shrink-0 border-t border-slate-200 bg-slate-100" />;
}

interface LeaguePortalHomeProps {
  league: LeaguePortalBranding;
  /** @deprecated Ya no se usa en `/`; reservado por compatibilidad. */
  programHome?: boolean;
}

/** Home pública de una liga (`/l/[slug]/`). */
export function LeaguePortalHome({ league, programHome = false }: LeaguePortalHomeProps) {
  const leagueId = league.leagueId?.trim();
  if (!leagueId) {
    console.error("[LeaguePortalHome] leagueId ausente en branding:", league.slug);
    return null;
  }

  const shell = (
    <>
      <SiteTopNav
        leagueSlug={programHome ? undefined : league.slug}
        leagueName={programHome ? undefined : league.name}
        leagueLogoUrl={programHome ? undefined : league.logoUrl}
        leagueId={leagueId}
      />

      <main className={`flex flex-1 flex-col pb-8 pt-2 ${PORTAL_SHELL_CLASS}`}>
        <Suspense fallback={<CarouselSkeleton />}>
          <PublicPortalCarouselSection leagueId={leagueId} leagueSlug={league.slug} />
        </Suspense>

        <Suspense fallback={<PublicTournamentsSkeleton />}>
          <PublicPortalTournamentsAsync leagueId={leagueId} portalLeagueSlug={league.slug} />
        </Suspense>

        <div className="mt-8 flex-1">
          <Suspense fallback={<GallerySkeleton />}>
            <DynamicClubGalleries
              leagueId={leagueId}
              leagueSlug={league.slug}
              leagueName={league.name}
              leagueLogoUrl={league.logoUrl}
            />
          </Suspense>
        </div>
      </main>

      <Suspense fallback={<FooterSkeleton />}>
        <SponsorFooter leagueId={leagueId} />
      </Suspense>
    </>
  );

  if (programHome) {
    return <div className="flex min-h-screen flex-1 flex-col bg-[#F5F5F5]">{shell}</div>;
  }

  return (
    <PortalLeagueTheme branding={league} showBanner>
      <div className="flex min-h-screen flex-1 flex-col bg-[#F5F5F5]">{shell}</div>
    </PortalLeagueTheme>
  );
}
