import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clubs, galleryPhotos } from "@/lib/db/schema";
import { ArrowLeft, Images } from "lucide-react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { ClubGalleryUpload } from "@/components/gallery/ClubGalleryUpload";
import { PhotoGalleryGrid } from "@/components/gallery/PhotoGalleryGrid";
import { photoRepository } from "@/repositories/photoRepository";
import { Pagination } from "@/components/gallery/Pagination";
import { isDashboardSuperAdmin } from "@/lib/auth/dashboard-super-admin";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ClubGaleriaPage({
  params,
  searchParams,
}: PageProps) {
  const { clubId } = await params;
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1"));
  const ITEMS_PER_PAGE = 30;

  const [club] = await db
    .select({ id: clubs.id, name: clubs.name, logoUrl: clubs.logoUrl, colorPrimary: clubs.colorPrimary })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);

  if (!club) redirect("/liga/clubs");

  // Obtener fotos paginadas y conteo total del club
  const [photos, totalCount] = await Promise.all([
    photoRepository.getByClub(clubId, currentPage, ITEMS_PER_PAGE),
    photoRepository.countByClub(clubId),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const accent = club.colorPrimary ?? "#005CEE";

  // Verificar permisos de eliminación
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isSuperAdmin = isDashboardSuperAdmin(user);
  const userClubId = user?.app_metadata?.club_id as string | undefined;

  // Un usuario puede borrar si es SuperAdmin o si es el delegado de este club específico
  const canDelete = isSuperAdmin || (Boolean(userClubId) && userClubId === clubId);

  // Adaptar al formato que espera PhotoGalleryGrid
  const gridPhotos = photos.map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
    alt: `Foto – ${club.name}`,
  }));

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {club.logoUrl && (
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border-2 border-white shadow-md" style={{ backgroundColor: `${accent}20` }}>
              <Image src={club.logoUrl} alt={`Logo ${club.name}`} fill className="object-contain p-1" sizes="48px" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Galería del Club</p>
            <h1 className="text-2xl font-black tracking-tight text-[#1e3a5f]">{club.name}</h1>
          </div>
          <span className="rounded-full bg-[#005CEE]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#005CEE]">
            {totalCount} foto{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
        <Link
          href={`/liga/clubs/${clubId}`}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Club
        </Link>
      </div>

      {/* ── Sección de Carga ── */}
      <section className="rounded-3xl border border-[#BFDBFE] bg-white p-6 shadow-[0_8px_32px_-8px_rgba(30,64,175,0.15)]">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#005CEE]/10">
            <Images className="h-5 w-5 text-[#005CEE]" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-[#1e3a5f]">Subir Nuevas Fotos</h2>
            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
              Las fotos quedarán vinculadas a {club.name}
            </p>
          </div>
        </div>
        <ClubGalleryUpload clubId={clubId} clubName={club.name} />
      </section>

      {/* ── Grid con Lightbox ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-[#1e3a5f]">
          Fotos del Club{" "}
          <span className="text-sm font-semibold text-slate-400">({totalCount})</span>
        </h2>

        {photos.length > 0 ? (
          <>
            <PhotoGalleryGrid
              photos={gridPhotos}
              emptyMessage="Aún no hay fotos para este club."
              emptySubMessage="Usa el formulario de arriba para subir las primeras imágenes."
              canDelete={canDelete}
            />
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl={`/liga/clubs/${clubId}/galeria`}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50 py-20 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              No hay más fotos en esta sección
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

