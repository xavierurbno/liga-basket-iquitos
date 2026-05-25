import { PhotoGalleryGrid } from "@/components/gallery/PhotoGalleryGrid";
import { Pagination } from "@/components/gallery/Pagination";
import { PublicGalleryShell } from "@/components/gallery/PublicGalleryShell";
import { photoRepository } from "@/repositories/photoRepository";
import { leaguePortalHome, leaguePortalInstitutionalGallery } from "@/lib/portal/league-portal-paths";
import type { PortalLeagueRow } from "@/lib/portal/portal-league-context";

const ITEMS_PER_PAGE = 30;

interface Props {
  league: PortalLeagueRow;
  currentPage: number;
}

export async function PublicInstitutionalGalleryView({ league, currentPage }: Props) {
  const [photos, totalCount] = await Promise.all([
    photoRepository.getGeneral(currentPage, ITEMS_PER_PAGE, league.leagueId),
    photoRepository.countGeneral(league.leagueId),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const baseUrl = leaguePortalInstitutionalGallery(league.slug);

  return (
    <PublicGalleryShell
      title="Galería LDDBI"
      subtitle={`Fotos institucionales · ${league.name}`}
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
              alt: "Foto institucional",
            }))}
            emptyMessage="Aún no hay fotos en la galería institucional."
            emptySubMessage="Vuelve más adelante para ver nuevas imágenes."
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
