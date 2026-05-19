import type { ReactNode } from "react";
import { GalleryCarousel } from "@/components/gallery/GalleryCarousel";
import { SponsorCarousel } from "@/components/sponsors/SponsorCarousel";
import { PublicNormativasHomeWidget } from "@/components/normativas/PublicNormativasHomeWidget";
import type { SponsorCarouselItem } from "@/components/sponsors/SponsorCarousel";

interface GalleryImage {
  id?: string;
  url: string;
  name: string;
  caption?: string;
}

interface MultimediaGalleryProps {
  images: GalleryImage[];
  /** `feb`: rejilla 4 columnas (75 % + 25 %); el padre debe aportar `PORTAL_SHELL_CLASS`. */
  layout?: "full" | "feb";
  /** Columna derecha FEB (patrocinadores + normativas); el padre puede envolverla en Suspense. */
  febRightColumn?: ReactNode;
}

const align = "px-4 sm:px-6 lg:px-8";

export function FebRightColumn({ sponsors }: { sponsors: SponsorCarouselItem[] }) {
  return (
    <div className="flex min-h-0 flex-col gap-3 lg:col-span-1 lg:min-h-0">
      <SponsorCarousel sponsors={sponsors} />
      <PublicNormativasHomeWidget />
    </div>
  );
}

export function FebRightColumnSkeleton() {
  return <FebRightColumn sponsors={[]} />;
}

export function MultimediaGallery({
  images,
  layout = "feb",
  febRightColumn,
}: MultimediaGalleryProps) {
  const rightColumn = febRightColumn ?? <FebRightColumnSkeleton />;

  if (!images || images.length === 0) {
    if (layout === "feb") {
      return (
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-4 lg:items-stretch lg:gap-3">
          <div className="min-w-0 lg:col-span-3">
            <div className="flex h-[280px] items-center justify-center rounded-sm border border-dashed border-slate-300 bg-slate-50 sm:h-[320px] lg:h-[380px]">
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                No hay fotos disponibles en la galería.
              </p>
            </div>
          </div>
          {rightColumn}
        </div>
      );
    }
    return (
      <div className={`w-full border-y border-dashed border-slate-200 bg-slate-50 py-16 ${align}`}>
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
          No hay fotos disponibles en la galería.
        </p>
      </div>
    );
  }

  const carouselPhotos = images.slice(0, 8).map((img) => ({
    id: img.id ?? img.url,
    url: img.url,
    caption: img.caption,
  }));

  if (layout === "feb") {
    return (
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-4 lg:items-stretch lg:gap-3">
        <div className="min-w-0 lg:col-span-3">
          <GalleryCarousel
            photos={carouselPhotos}
            fullBleed={false}
            visualVariant="feb"
          />
        </div>
        {rightColumn}
      </div>
    );
  }

  return (
    <div className="w-full">
      <GalleryCarousel photos={carouselPhotos} fullBleed />
    </div>
  );
}

