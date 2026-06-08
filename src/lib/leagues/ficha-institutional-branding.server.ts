import "server-only";

import { loadLeaguePortalBranding } from "@/lib/leagues/league-branding";
import { resolveLeagueDisplayLogoUrl } from "@/lib/logos/resolve-public-league-logo.server";
import { FICHA_T2 } from "@/lib/pdf/fichaInstitucionalTextos";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";
import { resolvePublicImageUrl } from "@/lib/validar/resolve-public-image-url";
import { leagueRepository } from "@/repositories/league.repository";
import { settingsRepository } from "@/repositories/settingsRepository";

export type FichaInstitutionalBranding = {
  leagueDisplayName: string;
  leagueLogoUrl: string;
  leagueSlug: string | null;
  showFederation: boolean;
  federationDisplayName: string | null;
  /** URL pública para vista previa HTML (null = sin logo federación). */
  federacionLogoUrl: string | null;
};

/** Branding de ficha/PDF institucional según liga operativa. */
export async function resolveFichaInstitutionalBranding(
  leagueId: string | null | undefined,
): Promise<FichaInstitutionalBranding> {
  let leagueDisplayName = FICHA_T2;
  let leagueLogoUrl = "/logos/liga.png";
  let leagueSlug: string | null = null;
  let showFederation = true;
  let federationDisplayName: string | null = null;
  let federacionLogoUrl: string | null = "/logos/federacion.png";

  if (!leagueId?.trim()) {
    return {
      leagueDisplayName,
      leagueLogoUrl,
      leagueSlug,
      showFederation,
      federationDisplayName,
      federacionLogoUrl,
    };
  }

  const id = leagueId.trim();
  const [leagueRow, settings] = await Promise.all([
    leagueRepository.findById(id),
    settingsRepository.getLeagueSettings(id),
  ]);

  if (!leagueRow) {
    return {
      leagueDisplayName,
      leagueLogoUrl,
      leagueSlug,
      showFederation,
      federationDisplayName,
      federacionLogoUrl,
    };
  }

  leagueSlug = leagueRow.slug;
  showFederation = settings?.carnetShowFederation !== false;
  federationDisplayName = settings?.carnetFederationDisplayName?.trim() || null;

  const branding = await loadLeaguePortalBranding(leagueRow);
  leagueDisplayName = branding.name;
  const resolvedLogo = await resolveLeagueDisplayLogoUrl({
    slug: leagueRow.slug,
    loginLogoUrl: branding.logoUrl,
  });
  leagueLogoUrl =
    resolvedLogo ?? (isPrimaryPortalLeagueSlug(leagueRow.slug) ? "/logos/liga.png" : "");

  if (!showFederation) {
    federacionLogoUrl = null;
  } else {
    const customFed = resolvePublicImageUrl(settings?.carnetFederationLogoUrl ?? null);
    federacionLogoUrl =
      customFed ?? (isPrimaryPortalLeagueSlug(leagueRow.slug) ? "/logos/federacion.png" : null);
  }

  return {
    leagueDisplayName,
    leagueLogoUrl,
    leagueSlug,
    showFederation,
    federationDisplayName,
    federacionLogoUrl,
  };
}
