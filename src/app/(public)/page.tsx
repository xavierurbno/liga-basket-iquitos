import { Suspense } from "react";
import { cookies } from "next/headers";
import { SiteTopNav } from "@/components/layout/SiteTopNav";
import { DynamicClubGalleries } from "@/components/gallery/DynamicClubGalleries";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { SponsorFooter } from "@/components/layout/SponsorFooter";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { resolvePortalLeagueId } from "@/lib/portal/resolve-portal-league";
import { PublicPortalCarouselSection } from "@/components/portal/PublicPortalCarouselSection";
import { PublicPortalTournamentsAsync } from "@/components/portal/PublicPortalTournamentsAsync";
import { PublicTournamentsSkeleton } from "@/components/portal/PublicTournamentsSkeleton";
import { PublicPortalMasterClock } from "@/components/portal/PublicPortalMasterClock";
import { PortalLeagueUnavailable } from "@/components/portal/PortalLeagueUnavailable";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ l?: string }>;
}

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

export default async function PublicPortalPage({ searchParams }: Props) {
  const { l: slug } = await searchParams;
  const cookieStore = await cookies();
  const activeSlug = cookieStore.get("active_league_slug")?.value;

  const leagueId = await resolvePortalLeagueId({
    querySlug: slug,
    cookieSlug: activeSlug,
  });

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#F5F5F5]">
      <SiteTopNav />

      <main className={`flex flex-1 flex-col pb-8 pt-2 ${PORTAL_SHELL_CLASS}`}>
        <div className="w-full">
          <PublicPortalMasterClock layoutAlign="start" />
        </div>

        {leagueId ? (
          <Suspense fallback={<CarouselSkeleton />}>
            <PublicPortalCarouselSection leagueId={leagueId} />
          </Suspense>
        ) : (
          <PortalLeagueUnavailable />
        )}

        {leagueId ? (
          <Suspense fallback={<PublicTournamentsSkeleton />}>
            <PublicPortalTournamentsAsync leagueId={leagueId} />
          </Suspense>
        ) : null}

        <div className="mt-8 flex-1">
          {leagueId ? (
            <Suspense fallback={<GallerySkeleton />}>
              <DynamicClubGalleries leagueId={leagueId} />
            </Suspense>
          ) : null}
        </div>
      </main>

      <Suspense fallback={<FooterSkeleton />}>
        <SponsorFooter leagueId={leagueId} />
      </Suspense>
    </div>
  );
}
