import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicClubGalleryMeta } from "@/lib/loaders/club-page.loader";
import { clubRepository } from "@/repositories/clubRepository";
import { PhotoGalleryGrid } from "@/components/gallery/PhotoGalleryGrid";
import { Pagination } from "@/components/gallery/Pagination";
import { PublicGalleryShell } from "@/components/gallery/PublicGalleryShell";
import { photoRepository } from "@/repositories/photoRepository";
import { fetchPortalLeagueBranding } from "@/lib/portal/portal-league-cache";
import { leaguePortalClubGallery, leaguePortalHome } from "@/lib/portal/league-portal-paths";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 30;

interface PageProps {
  params: Promise<{ leagueSlug: string; clubId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { clubId } = await params;
  const club = await clubRepository.findNameById(clubId);
  return { title: club ? `Galería · ${club.name}` : "Galería del club" };
}

export default async function LeagueClubGalleryPage({ params, searchParams }: PageProps) {
  const { leagueSlug, clubId } = await params;
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));

  const league = await fetchPortalLeagueBranding(leagueSlug);
  if (!league) notFound();

  const club = await loadPublicClubGalleryMeta(clubId);

  if (!club || club.leagueId !== league.leagueId) notFound();

  const [photos, totalCount] = await Promise.all([
    photoRepository.getByClub(clubId, currentPage, ITEMS_PER_PAGE),
    photoRepository.countByClub(clubId),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const baseUrl = leaguePortalClubGallery(league.slug, clubId);

  return (
    <PublicGalleryShell
      title={club.name}
      subtitle={`Galería del club · ${league.name}`}
      photoCount={totalCount}
      leagueSlug={league.slug}
      leagueName={league.name}
      leagueLogoUrl={league.logoUrl}
      backHref={leaguePortalHome(league.slug)}
    >
      {photos.length > 0 ? (
        <>
          <PhotoGalleryGrid
            photos={photos.map((p) => ({
              id: p.id,
              url: p.url,
              caption: p.caption,
              alt: `Foto – ${club.name}`,
            }))}
            canDelete={false}
          />
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Aún no hay fotos publicadas
          </p>
        </div>
      )}
    </PublicGalleryShell>
  );
}
