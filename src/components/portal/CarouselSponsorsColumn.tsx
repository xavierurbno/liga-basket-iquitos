import { FebRightColumn } from "@/components/system/MultimediaGallery";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import { sponsorRepository } from "@/repositories/sponsorRepository";

const SPONSORS_MS = 6_000;

export async function CarouselSponsorsColumn({
  leagueId,
  leagueSlug,
}: {
  leagueId: string;
  leagueSlug?: string;
}) {
  try {
    const rows = await withQueryTimeout(
      sponsorRepository.findByLeague(leagueId),
      SPONSORS_MS,
      "carouselSponsors"
    );
    const sponsors = rows.map((s) => ({
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl,
      websiteUrl: s.websiteUrl,
    }));
    return <FebRightColumn sponsors={sponsors} leagueSlug={leagueSlug} />;
  } catch (err) {
    console.warn("[portal] patrocinadores carrusel no disponibles:", err);
    return <FebRightColumn sponsors={[]} leagueSlug={leagueSlug} />;
  }
}
