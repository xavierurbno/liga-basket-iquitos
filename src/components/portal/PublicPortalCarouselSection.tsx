import { Suspense } from "react";
import {
  FebRightColumnSkeleton,
  MultimediaGallery,
} from "@/components/system/MultimediaGallery";
import { CarouselSponsorsColumn } from "@/components/portal/CarouselSponsorsColumn";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import { getRandomCarouselPhotos } from "@/services/galleryService";

const CAROUSEL_MS = 12_000;

export async function PublicPortalCarouselSection({
  leagueId,
  leagueSlug,
}: {
  leagueId: string;
  leagueSlug?: string;
}) {
  if (!leagueId?.trim()) {
    console.warn("[portal] carrusel omitido: leagueId vacío");
    return null;
  }

  let photos: Awaited<ReturnType<typeof getRandomCarouselPhotos>> = [];
  try {
    photos = await withQueryTimeout(
      getRandomCarouselPhotos(8, leagueId.trim()),
      CAROUSEL_MS,
      "portalCarousel"
    );
  } catch (err) {
    console.warn("[portal] carrusel no disponible:", err);
  }

  return (
    <section className="mt-3 shrink-0" aria-label="Carrusel de fotos">
      <MultimediaGallery
        images={photos}
        layout="feb"
        febRightColumn={
          <Suspense fallback={<FebRightColumnSkeleton />}>
            <CarouselSponsorsColumn leagueId={leagueId} leagueSlug={leagueSlug} />
          </Suspense>
        }
      />
    </section>
  );
}
