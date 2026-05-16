import { Suspense } from "react";
import { cookies } from "next/headers";
import { leagueRepository } from "@/repositories/league.repository";
import { MasterClockCounter } from "@/components/system/MasterClockCounter";
import { SiteTopNav } from "@/components/layout/SiteTopNav";
import { MultimediaGallery } from "@/components/system/MultimediaGallery";
import { DynamicClubGalleries } from "@/components/gallery/DynamicClubGalleries";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { SponsorFooter } from "@/components/layout/SponsorFooter";
import { getRandomCarouselPhotos } from "@/services/galleryService";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ l?: string }>;
}

export default async function PublicPortalPage({ searchParams }: Props) {
  const { l: slug } = await searchParams;
  const cookieStore = await cookies();

  let league: { id: string; name: string; slug: string } | null = null;
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
  } catch (err) {
    console.error("[portal] Liga:", err);
  }

  const activeSlug = cookieStore.get("active_league_slug")?.value;
  let leagueId = league?.id;
  if (activeSlug) {
    const bySlug = await leagueRepository.findBySlug(activeSlug);
    if (bySlug) leagueId = bySlug.id;
  }
  if (!leagueId) {
    const all = await leagueRepository.findAll();
    leagueId = all.find((l) => l.slug.includes("iquitos"))?.id ?? all[0]?.id;
  }

  const carouselPhotos = leagueId ? await getRandomCarouselPhotos(5, leagueId) : [];

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#F5F5F5]">
      <SiteTopNav />

      <main className={`flex flex-1 flex-col pb-8 pt-2 ${PORTAL_SHELL_CLASS}`}>
        <div className="w-full">
          <MasterClockCounter layoutAlign="start" />
        </div>

        <section className="mt-3 shrink-0" aria-label="Carrusel de fotos">
          <MultimediaGallery images={carouselPhotos} layout="feb" leagueId={leagueId ?? undefined} />
        </section>

        <div className="mt-8 flex-1">
          <Suspense fallback={<GallerySkeleton />}>
            {leagueId ? <DynamicClubGalleries leagueId={leagueId} /> : null}
          </Suspense>
        </div>
      </main>

      <SponsorFooter leagueId={leagueId} />
    </div>
  );
}
