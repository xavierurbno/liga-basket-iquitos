import "server-only";

import {
  buildCarnetAuthorizationText,
  resolveCarnetValidityLabel,
} from "@/lib/carnet/carnetInstitucionalText";
import { isLddbiCarnetPreset } from "@/lib/carnet/lddbiTemplateLayout";
import {
  LDDBI_PREMIUM_ACCENT_HEX,
  LDDBI_PREMIUM_PRIMARY_HEX,
} from "@/lib/carnet/lddbiPremiumTheme";
import { parseCarnetThemePreset, resolveCarnetThemeConfig } from "@/lib/carnet/carnetTheme";
import type { CarnetPlayerGender, CarnetVistaPreviaProps } from "@/lib/types/carnet";
import type { FichaVistaPreviaProps } from "@/lib/types/ficha";
import { loadLeaguePortalBranding } from "@/lib/leagues/league-branding";
import {
  formatCarnetNumberForLeague,
  resolveLeagueCarnetPrefix,
} from "@/lib/leagues/league-carnet-prefix";
import { normalizePortalHexColor } from "@/lib/leagues/portal-colors";
import { resolveLeagueDisplayLogoUrl } from "@/lib/logos/resolve-public-league-logo.server";
import { FICHA_T2 } from "@/lib/pdf/fichaInstitucionalTextos";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";
import { buildPlayerValidationUrl } from "@/lib/validation/build-validation-url.server";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { resolvePublicImageUrl } from "@/lib/validar/resolve-public-image-url";
import { categoryRepository } from "@/repositories/categoryRepository";
import { clubRepository } from "@/repositories/clubRepository";
import { leagueRepository } from "@/repositories/league.repository";
import { playerRepository } from "@/repositories/playerRepository";
import { settingsRepository } from "@/repositories/settingsRepository";
import type { PlayerStatus } from "@/lib/db/schema";

function aIso(date: Date | null | undefined): string {
  if (!date) return "";
  const t = new Date(date);
  if (Number.isNaN(t.getTime())) return "";
  return t.toISOString();
}

async function resolveLeagueFichaBranding(leagueId: string | null | undefined) {
  let leagueDisplayName = FICHA_T2;
  let leagueLogoUrl = "/logos/liga.png";

  if (!leagueId?.trim()) {
    return { leagueDisplayName, leagueLogoUrl };
  }

  const leagueRow = await leagueRepository.findById(leagueId);
  if (!leagueRow) return { leagueDisplayName, leagueLogoUrl };

  const branding = await loadLeaguePortalBranding(leagueRow);
  leagueDisplayName = branding.name;
  const resolvedLogo = await resolveLeagueDisplayLogoUrl({
    slug: leagueRow.slug,
    loginLogoUrl: branding.logoUrl,
  });
  leagueLogoUrl =
    resolvedLogo ?? (isPrimaryPortalLeagueSlug(leagueRow.slug) ? "/logos/liga.png" : "");

  return { leagueDisplayName, leagueLogoUrl };
}

export async function loadCategoryFichaValidation(categoryId: string): Promise<{
  ficha: FichaVistaPreviaProps;
  estadosPorJugador: Record<string, PlayerStatus | null | undefined>;
  leagueName: string | null;
  accentColor: string;
} | null> {
  const context = await categoryRepository.findValidationContextById(categoryId);
  if (!context) return null;

  const [staff, jugadores, roster] = await Promise.all([
    categoryRepository.findFichaStaffByIdAndClub(categoryId, context.clubId),
    playerRepository.findForFichaByCategory(context.clubId, categoryId),
    playerRepository.findValidationRosterByCategoryId(categoryId),
  ]);

  if (!staff) return null;

  const clubRow = await clubRepository.findFichaClub(context.clubId);

  const effectiveLeagueId = clubRow?.leagueId?.trim() || null;
  const { leagueDisplayName, leagueLogoUrl } = await resolveLeagueFichaBranding(effectiveLeagueId);

  let accentColor = "#0d9488";
  if (effectiveLeagueId) {
    const settings = await settingsRepository.getLeagueSettings(effectiveLeagueId);
    accentColor = normalizePortalHexColor(settings?.portalAccentColor, "#0d9488");
  }

  const categoriaDetalle = lineaCategoriaInstitucional(
    context.categoriaNombre,
    jugadores.map((j) => j.gender),
  );

  const estadosPorJugador: Record<string, PlayerStatus | null | undefined> = {};
  for (const p of roster) {
    estadosPorJugador[p.id] = p.status ?? "PENDIENTE_PAGO";
  }

  const players = jugadores.map((j) => ({
    id: j.id,
    name: j.name,
    lastname: j.lastname,
    documentType: j.documentType,
    documentNumber: j.documentNumber,
    fechaNacimientoIso: aIso(j.birthdate),
    photoUrl: resolvePublicImageUrl(j.photoUrl),
    jerseyNumber: j.jerseyNumber,
  }));

  return {
    leagueName: context.leagueName,
    accentColor,
    estadosPorJugador,
    ficha: {
      leagueDisplayName,
      leagueLogoUrl,
      clubName: context.clubName,
      clubLogoUrl: resolvePublicImageUrl(clubRow?.logoUrl ?? null),
      categoriaDetalle,
      players,
      entrenador: {
        name: staff.coachName,
        lastname: staff.coachLastname,
        documentType: staff.coachDocumentType,
        documentNumber: staff.coachDocumentNumber,
        photoUrl: resolvePublicImageUrl(staff.coachPhotoUrl),
      },
      delegado: {
        name: staff.delegateName,
        lastname: staff.delegateLastname,
        documentType: staff.delegateDocumentType,
        documentNumber: staff.delegateDocumentNumber,
        photoUrl: resolvePublicImageUrl(staff.delegatePhotoUrl),
      },
    },
  };
}

export async function loadPlayerCarnetValidation(playerId: string): Promise<{
  carnetProps: CarnetVistaPreviaProps;
  status: PlayerStatus | null | undefined;
  leagueName: string | null;
  accentColor: string;
} | null> {
  const jugador = await playerRepository.findCarnetValidationById(playerId);
  if (!jugador) return null;

  const effectiveLeagueId = jugador.leagueId?.trim() || null;
  const leagueRow = effectiveLeagueId
    ? await leagueRepository.findById(effectiveLeagueId)
    : null;
  const leagueSettings = effectiveLeagueId
    ? await settingsRepository.getLeagueSettings(effectiveLeagueId)
    : null;

  const cityPrefix = resolveLeagueCarnetPrefix({
    slug: jugador.leagueSlug,
    name: jugador.leagueName,
  });
  const leagueDisplayName = jugador.leagueName ?? "Liga deportiva";
  const carnetDisplay = formatCarnetNumberForLeague(jugador.carnetNumber, cityPrefix);
  const categoriaDetalle = jugador.categoriaNombre
    ? lineaCategoriaInstitucional(jugador.categoriaNombre, [jugador.gender])
    : "—";
  const categoriaCarnet = jugador.categoriaNombre?.trim() ?? "—";
  const fotoPublica = resolvePublicImageUrl(jugador.photoUrl);
  const leagueLogoUrl = resolvePublicImageUrl(leagueSettings?.loginLogoUrl ?? null);
  const showFederation = leagueSettings?.carnetShowFederation !== false;
  const federacionLogoUrl = showFederation
    ? resolvePublicImageUrl(leagueSettings?.carnetFederationLogoUrl ?? null) ??
      "/logos/federacion.png"
    : null;
  const carnetSportGraphicUrl = resolvePublicImageUrl(
    leagueSettings?.carnetSportGraphicUrl ?? null,
  );
  const presidentSignatureUrl = resolvePublicImageUrl(
    leagueSettings?.presidentSignatureUrl ?? null,
  );
  const secretarySignatureUrl = resolvePublicImageUrl(
    leagueSettings?.secretarySignatureUrl ?? null,
  );
  const carnetTheme = resolveCarnetThemeConfig(leagueSettings);
  const authorizationText = buildCarnetAuthorizationText(
    leagueDisplayName,
    leagueSettings?.carnetAuthorizationTemplate,
    { lddbiPreset: isLddbiCarnetPreset(carnetTheme.preset) },
  );
  const vigenciaLabel = resolveCarnetValidityLabel(
    leagueSettings?.carnetValidityLabel,
    leagueSettings?.seasonName,
  );
  const validationUrl = buildPlayerValidationUrl(jugador.id, "");
  const portalPrimaryColor = isLddbiCarnetPreset(carnetTheme.preset)
    ? LDDBI_PREMIUM_PRIMARY_HEX
    : normalizePortalHexColor(leagueSettings?.portalPrimaryColor, "#1e3a5f");
  const portalAccentColor = isLddbiCarnetPreset(carnetTheme.preset)
    ? LDDBI_PREMIUM_ACCENT_HEX
    : normalizePortalHexColor(leagueSettings?.portalAccentColor, "#0d9488");
  const fechaNacimientoLabel = jugador.birthdate
    ? new Date(jugador.birthdate).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  return {
    leagueName: jugador.leagueName,
    accentColor: portalAccentColor,
    status: jugador.status,
    carnetProps: {
      leagueId: effectiveLeagueId,
      playerId: jugador.id,
      leagueDisplayName,
      clubLogoUrl: resolvePublicImageUrl(jugador.clubLogoUrl),
      documentType: jugador.documentType,
      fechaNacimientoIso: aIso(jugador.birthdate),
      categoriaDetalle,
      leagueLogoUrl,
      federacionLogoUrl,
      photoUrl: fotoPublica,
      name: jugador.name,
      lastname: jugador.lastname,
      documentNumber: jugador.documentNumber,
      fechaNacimientoLabel,
      gender: jugador.gender as CarnetPlayerGender,
      clubName: jugador.clubName,
      federationSportsCode: jugador.federationCode,
      leagueSportsCode: cityPrefix,
      categoriaNombre: categoriaCarnet,
      carnetNumberDisplay: carnetDisplay,
      presidentDisplayName: leagueSettings?.presidentDisplayName ?? "",
      secretaryDisplayName: leagueSettings?.secretaryDisplayName ?? "",
      presidentSignatureUrl,
      secretarySignatureUrl,
      authorizationText,
      vigenciaLabel,
      validationUrl,
      portalPrimaryColor,
      portalAccentColor,
      carnetThemePreset: parseCarnetThemePreset(leagueSettings?.carnetThemePreset),
      carnetShowFederation: showFederation,
      carnetFederationDisplayName: leagueSettings?.carnetFederationDisplayName,
      carnetSportLabel: leagueSettings?.carnetSportLabel,
      carnetSportGraphicUrl,
      presentationMode: "validacion",
    },
  };
}
