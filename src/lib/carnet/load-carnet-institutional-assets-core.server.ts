import "server-only";

import { buildCarnetInstitucionalContext } from "@/lib/carnet/buildCarnetInstitucionalContext";
import { resolveCarnetTemplatePngAssets } from "@/lib/carnet/lddbiTemplateAssets.server";
import { parseCarnetThemePreset } from "@/lib/carnet/carnetTheme";
import type { CarnetInstitutionalAssetsResult } from "@/lib/types/carnet";
import {
  resolveFederationLogoForLeaguePngDataUrl,
  resolveFederationMonoLogoForLeaguePngDataUrl,
  resolveImageUrlToPngDataUrl,
  resolveLeagueLogoPngDataUrl,
  resolveLeagueMonoLogoForLeaguePngDataUrl,
} from "@/lib/logos/resolve-league-logo-buffer";
import { settingsRepository } from "@/repositories/settingsRepository";
import { leagueRepository } from "@/repositories/league.repository";

/** Carga plantillas, logos y contexto del carnet (sin comprobar sesión). */
export async function loadCarnetInstitutionalAssetsCore(
  leagueIdNorm: string,
): Promise<CarnetInstitutionalAssetsResult> {
  const [settings, leagueRow, ligaLogoPng, ligaLogoMonoPng, federacionLogoPng, federacionLogoMonoPng] =
    await Promise.all([
      settingsRepository.getLeagueSettings(leagueIdNorm),
      leagueRepository.findById(leagueIdNorm),
      resolveLeagueLogoPngDataUrl(leagueIdNorm, 600),
      resolveLeagueMonoLogoForLeaguePngDataUrl(leagueIdNorm, 600),
      resolveFederationLogoForLeaguePngDataUrl(leagueIdNorm, 400),
      resolveFederationMonoLogoForLeaguePngDataUrl(leagueIdNorm, 400),
    ]);

  const leagueDisplayName = leagueRow?.name?.trim() || "Liga deportiva";
  const theme = buildCarnetInstitucionalContext(leagueDisplayName, settings).theme;

  if (theme.showFederation && !federacionLogoPng) {
    return {
      success: false,
      error: "No se pudo cargar el logo de la federación.",
    };
  }

  const [presidentSignaturePng, secretarySignaturePng, sportGraphicFromLeague] =
    await Promise.all([
      resolveImageUrlToPngDataUrl(settings?.presidentSignatureUrl, 500),
      resolveImageUrlToPngDataUrl(settings?.secretarySignatureUrl, 500),
      resolveImageUrlToPngDataUrl(settings?.carnetSportGraphicUrl, 500),
    ]);

  const context = buildCarnetInstitucionalContext(
    leagueDisplayName,
    settings,
    leagueRow?.slug,
  );
  const templatePngs = await resolveCarnetTemplatePngAssets(
    parseCarnetThemePreset(settings?.carnetThemePreset),
  );

  return {
    success: true,
    context,
    urls: {
      ligaLogoUrl: settings?.loginLogoUrl?.trim() || null,
      federacionLogoUrl: settings?.carnetFederationLogoUrl?.trim() || null,
      presidentSignatureUrl: settings?.presidentSignatureUrl?.trim() || null,
      secretarySignatureUrl: settings?.secretarySignatureUrl?.trim() || null,
    },
    ligaLogoPngDataUrl: ligaLogoPng,
    ligaLogoMonoPngDataUrl: ligaLogoMonoPng,
    federacionLogoPngDataUrl: theme.showFederation ? federacionLogoPng : null,
    federacionLogoMonoPngDataUrl: theme.showFederation ? federacionLogoMonoPng : null,
    sportGraphicPngDataUrl: sportGraphicFromLeague,
    presidentSignaturePngDataUrl: presidentSignaturePng,
    secretarySignaturePngDataUrl: secretarySignaturePng,
    anversoTemplatePngDataUrl: templatePngs?.anversoTemplatePngDataUrl ?? null,
    reversoTemplatePngDataUrl: templatePngs?.reversoTemplatePngDataUrl ?? null,
  };
}
