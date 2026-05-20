import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PhotoGalleryGrid } from "@/components/gallery/PhotoGalleryGrid";
import { Pagination } from "@/components/gallery/Pagination";
import { PublicGalleryShell } from "@/components/gallery/PublicGalleryShell";
import { photoRepository } from "@/repositories/photoRepository";
import { resolvePortalLeagueId } from "@/lib/portal/resolve-portal-league";
import { PortalLeagueUnavailable } from "@/components/portal/PortalLeagueUnavailable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galería institucional",
  description: "Fotografías oficiales de la Liga Deportiva Distrital de Basket de Iquitos",
};

const ITEMS_PER_PAGE = 30;

interface PageProps {
  searchParams: Promise<{ page?: string; l?: string }>;
}

export default async function PublicInstitutionalGalleryPage({ searchParams }: PageProps) {
  const { page: pageStr, l: slug } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));

  const cookieStore = await cookies();
  const activeSlug = cookieStore.get("active_league_slug")?.value;

  const leagueId = await resolvePortalLeagueId({
    querySlug: slug,
    cookieSlug: activeSlug,
  });

  if (!leagueId) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
        <PortalLeagueUnavailable />
      </div>
    );
  }

  const [photos, totalCount] = await Promise.all([
    photoRepository.getGeneral(currentPage, ITEMS_PER_PAGE, leagueId),
    photoRepository.countGeneral(leagueId),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <PublicGalleryShell
      title="Galería LDDBI"
      subtitle="Fotos institucionales de la liga"
      photoCount={totalCount}
    >
      {photos.length > 0 ? (
        <>
          <PhotoGalleryGrid
            photos={photos.map((p) => ({
              id: p.id,
              url: p.url,
              caption: p.caption,
              alt: "Foto institucional LDDBI",
            }))}
            emptyMessage="Aún no hay fotos en la galería institucional."
            emptySubMessage="Vuelve más adelante para ver nuevas imágenes del torneo."
            canDelete={false}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/galeria-institucional"
          />
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
