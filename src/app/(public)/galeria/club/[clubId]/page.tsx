import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { PhotoGalleryGrid } from "@/components/gallery/PhotoGalleryGrid";
import { Pagination } from "@/components/gallery/Pagination";
import { PublicGalleryShell } from "@/components/gallery/PublicGalleryShell";
import { photoRepository } from "@/repositories/photoRepository";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 30;

interface PageProps {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { clubId } = await params;
  const [club] = await db
    .select({ name: clubs.name })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);

  const name = club?.name ?? "Club";
  return {
    title: `Galería · ${name}`,
    description: `Fotografías del club ${name} en la Liga de Basket de Iquitos`,
  };
}

export default async function PublicClubGalleryPage({ params, searchParams }: PageProps) {
  const { clubId } = await params;
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));

  const [club] = await db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);

  if (!club) notFound();

  const [photos, totalCount] = await Promise.all([
    photoRepository.getByClub(clubId, currentPage, ITEMS_PER_PAGE),
    photoRepository.countByClub(clubId),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <PublicGalleryShell
      title={club.name}
      subtitle="Galería del club"
      photoCount={totalCount}
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
            emptyMessage="Aún no hay fotos para este club."
            emptySubMessage="Vuelve más adelante para ver nuevas imágenes."
            canDelete={false}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/galeria/club/${clubId}`}
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
