import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { GeneralGalleryUpload } from "@/components/gallery/GeneralGalleryUpload";
import { PhotoGalleryGrid } from "@/components/gallery/PhotoGalleryGrid";
import { photoRepository } from "@/repositories/photoRepository";
import { Pagination } from "@/components/gallery/Pagination";
import { isDashboardSuperAdmin } from "@/lib/auth/dashboard-super-admin";
import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { resolveDefaultPortalLeagueId } from "@/lib/portal/portal-league-cache";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function GaleriaGeneralPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1"));
  const ITEMS_PER_PAGE = 30;

  const { leagueId: operationalLeagueId, leagueName } = await getLigaOperationalContext();
  const leagueId =
    operationalLeagueId ?? (await resolveDefaultPortalLeagueId()) ?? undefined;

  if (!leagueId) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-sm font-bold text-amber-900">
          Selecciona una liga activa para ver y subir fotos institucionales.
        </p>
        <Link
          href="/liga/"
          className="mt-4 inline-block text-sm font-black text-[#005CEE] hover:underline"
        >
          Ir al panel de gestión →
        </Link>
      </div>
    );
  }

  const [photos, totalCount] = await Promise.all([
    photoRepository.getGeneral(currentPage, ITEMS_PER_PAGE, leagueId),
    photoRepository.countGeneral(leagueId),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Verificar permisos de eliminación (Solo SuperAdmin para galería general)
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
  const canDelete = isDashboardSuperAdmin(user);

  return (
    <div className="space-y-8">
      {/* ── Sección de Carga Masiva ── */}
      <section className="rounded-3xl border border-[#BFDBFE] bg-white p-6 shadow-[0_8px_32px_-8px_rgba(30,64,175,0.15)]">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#005CEE]/10">
            <ShieldCheck className="h-5 w-5 text-[#005CEE]" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-[#1e3a5f]">
              Registro Masivo · Galería Institucional
            </h2>
            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
              {leagueName
                ? `${leagueName} · visibles en el portal y carrusel público`
                : "Visibles en el portal y carrusel público de la liga activa"}
            </p>
          </div>
        </div>
        <GeneralGalleryUpload />
      </section>

      {/* ── Grid con Lightbox ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-[#1e3a5f]">
          Archivo General{" "}
          <span className="text-sm font-semibold text-slate-400">({totalCount})</span>
        </h2>
        
        {photos.length > 0 ? (
          <>
            <PhotoGalleryGrid
              photos={photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption, alt: "Foto LDDBI" }))}
              emptyMessage="Aún no hay fotos en la galería general."
              emptySubMessage="Usa el formulario de arriba para subir imágenes de la liga."
              canDelete={canDelete}
            />
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/liga/galeria-general"
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
