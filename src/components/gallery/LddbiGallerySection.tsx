import Image from "next/image";
import { getGeneralPhotos } from "@/services/galleryService";
import { Globe } from "lucide-react";

/**
 * LddbiGallerySection — Server Component
 *
 * Muestra las fotos generales de la liga (club_id IS NULL) en un grid
 * al mismo nivel jerárquico que DynamicClubGalleries.
 * Se oculta automáticamente si no hay fotos generales.
 */
export async function LddbiGallerySection() {
  const photos = await getGeneralPhotos(24);

  if (photos.length === 0) return null;

  return (
    <section className="space-y-6">
      {/* ── Encabezado (mismo estilo que "GALERÍAS POR CLUB") ── */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-black tracking-tight text-[#1e3a5f]">
          GALERÍA{" "}
          <span className="text-[#005CEE]">LDDBI</span>
        </h2>
        <span className="rounded-full bg-[#005CEE]/10 px-4 py-1.5 text-[11px] font-bold text-[#005CEE] tracking-wider uppercase">
          {photos.length} foto{photos.length !== 1 ? "s" : ""} generales
        </span>
      </div>

      {/* ── Contenedor "carpeta" ── */}
      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#005CEE]/10">
            <Globe className="h-4 w-4 text-[#005CEE]" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-[#1e3a5f]">Acervo General</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Fotos sin club asignado · Liga de Basket de Iquitos
            </p>
          </div>
        </div>

        {/* Grid de fotos */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {photos.map((photo, idx) => (
            <div
              key={photo.id ?? idx}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <Image
                src={photo.url}
                alt={photo.caption ?? `Foto general ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />
              {/* Caption reveal on hover */}
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/75 to-transparent px-3 py-2.5 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="line-clamp-2 text-[10px] font-medium text-white/90">
                    {photo.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
