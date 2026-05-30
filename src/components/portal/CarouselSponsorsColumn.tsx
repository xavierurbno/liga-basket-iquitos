import { FebRightColumn } from "@/components/system/MultimediaGallery";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import { settingsRepository } from "@/repositories/settingsRepository";
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
    const [rows, settings] = await Promise.all([
      withQueryTimeout(sponsorRepository.findByLeague(leagueId), SPONSORS_MS, "carouselSponsors"),
      withQueryTimeout(settingsRepository.getLeagueSettings(leagueId), SPONSORS_MS, "carouselSponsorSettings"),
    ]);
    const sponsors = rows.map((s) => ({
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl,
      websiteUrl: s.websiteUrl,
    }));
    const headerLogoUrl =
      settings?.loginLogoUrl?.trim() ||
      settings?.carnetFederationLogoUrl?.trim() ||
      null;
    return (
      <FebRightColumn
        sponsors={sponsors}
        leagueSlug={leagueSlug}
        headerLogoUrl={headerLogoUrl}
        headerLogoAlt="Logo de la liga"
      />
    );
  } catch (err) {
    console.warn("[portal] patrocinadores carrusel no disponibles:", err);
    return <FebRightColumn sponsors={[]} leagueSlug={leagueSlug} />;
  }
}
