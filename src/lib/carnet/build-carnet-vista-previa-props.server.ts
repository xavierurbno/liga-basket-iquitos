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
import { resolveCarnetThemeConfig } from "@/lib/carnet/carnetTheme";
import type { CarnetPlayerGender, CarnetVistaPreviaProps } from "@/lib/types/carnet";
import {
  formatCarnetNumberForLeague,
  resolveLeagueCarnetPrefix,
} from "@/lib/leagues/league-carnet-prefix";
import { normalizePortalHexColor } from "@/lib/leagues/portal-colors";
import { maskDocumentNumber } from "@/lib/observability/mask-document-number";
import { resolvePlayerPhotoUrl } from "@/lib/storage/player-photo-url.server";
import { buildPlayerValidationUrl } from "@/lib/validation/build-validation-url.server";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { resolvePublicImageUrl } from "@/lib/validar/resolve-public-image-url";
import { leagueRepository } from "@/repositories/league.repository";
import { settingsRepository } from "@/repositories/settingsRepository";

export type CarnetPlayerSource = {
  id: string;
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  birthdate: Date | null;
  photoUrl: string | null;
  carnetNumber: string | null;
  gender: CarnetPlayerGender;
};

export type CarnetClubSource = {
  name: string;
  logoUrl: string | null;
  federationCode: string | null;
  leagueId: string | null;
  joinedLeagueId?: string | null;
};

type BuildCarnetVistaPreviaPropsInput = {
  jugador: CarnetPlayerSource;
  club: CarnetClubSource;
  categoryName: string;
  /** Cookie/sesión en panel admin; en /validar usar null. */
  operationalLeagueId?: string | null;
  leagueSlug?: string | null;
  leagueName?: string | null;
  presentationMode?: "admin" | "validacion";
};

function birthdateToIso(date: Date | null): string {
  if (!date) return "";
  const t = new Date(date);
  if (Number.isNaN(t.getTime())) return "";
  return t.toISOString();
}

/** Misma resolución de liga que la página de carnet del panel (sin cookie en /validar). */
export async function resolveEffectiveLeagueIdForCarnet(opts: {
  clubLeagueId?: string | null;
  joinedLeagueId?: string | null;
  operationalLeagueId?: string | null;
  leagueSlug?: string | null;
}): Promise<string | null> {
  const fromClub = opts.clubLeagueId?.trim() || opts.joinedLeagueId?.trim();
  if (fromClub) return fromClub;

  const fromOperational = opts.operationalLeagueId?.trim();
  if (fromOperational) return fromOperational;

  const slug = opts.leagueSlug?.trim();
  if (slug) {
    const bySlug = await leagueRepository.findBySlug(slug);
    if (bySlug?.id) return bySlug.id;
  }

  const portal = await leagueRepository.findDefaultForPortal();
  return portal?.id ?? null;
}

/** Props idénticas a `carnet/page.tsx` → `CarnetVistaPrevia`. */
export async function buildCarnetVistaPreviaPropsServer(
  input: BuildCarnetVistaPreviaPropsInput,
): Promise<CarnetVistaPreviaProps> {
  const effectiveLeagueId = await resolveEffectiveLeagueIdForCarnet({
    clubLeagueId: input.club.leagueId,
    joinedLeagueId: input.club.joinedLeagueId,
    operationalLeagueId: input.operationalLeagueId,
    leagueSlug: input.leagueSlug,
  });

  const leagueRow = effectiveLeagueId
    ? await leagueRepository.findById(effectiveLeagueId)
    : null;

  const cityPrefix = resolveLeagueCarnetPrefix({
    slug: leagueRow?.slug ?? input.leagueSlug,
    name: leagueRow?.name ?? input.leagueName,
  });

  const leagueDisplayName = leagueRow?.name ?? input.leagueName ?? "Liga deportiva";
  const carnetDisplay = formatCarnetNumberForLeague(input.jugador.carnetNumber, cityPrefix);
  const categoriaDetalle = lineaCategoriaInstitucional(input.categoryName, [input.jugador.gender]);
  const categoriaCarnet = input.categoryName.trim();
  const isValidacion = input.presentationMode === "validacion";
  const fotoPublica = await resolvePlayerPhotoUrl(input.jugador.photoUrl, {
    intent: isValidacion ? "public" : "intranet",
  });

  const leagueSettings = effectiveLeagueId
    ? await settingsRepository.getLeagueSettings(effectiveLeagueId)
    : null;

  const leagueLogoUrl = resolvePublicImageUrl(leagueSettings?.loginLogoUrl ?? null);
  const showFederation = leagueSettings?.carnetShowFederation !== false;
  const federacionLogoUrl = showFederation
    ? resolvePublicImageUrl(leagueSettings?.carnetFederationLogoUrl ?? null) ??
      "/logos/federacion-color.png"
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
  const validationUrl = buildPlayerValidationUrl(input.jugador.id, "");
  const portalPrimaryColor = isLddbiCarnetPreset(carnetTheme.preset)
    ? LDDBI_PREMIUM_PRIMARY_HEX
    : normalizePortalHexColor(leagueSettings?.portalPrimaryColor, "#1e3a5f");
  const portalAccentColor = isLddbiCarnetPreset(carnetTheme.preset)
    ? LDDBI_PREMIUM_ACCENT_HEX
    : normalizePortalHexColor(leagueSettings?.portalAccentColor, "#0d9488");
  const fechaNacimientoLabel = (() => {
    if (!input.jugador.birthdate) return "—";
    const d = new Date(input.jugador.birthdate);
    if (Number.isNaN(d.getTime())) return "—";
    if (isValidacion) {
      return String(d.getFullYear());
    }
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  })();

  const documentNumber = isValidacion
    ? maskDocumentNumber(input.jugador.documentNumber)
    : input.jugador.documentNumber;

  return {
    leagueId: effectiveLeagueId,
    leagueSlug: leagueRow?.slug ?? input.leagueSlug ?? null,
    playerId: input.jugador.id,
    leagueDisplayName,
    clubLogoUrl: resolvePublicImageUrl(input.club.logoUrl),
    documentType: input.jugador.documentType,
    fechaNacimientoIso: isValidacion ? "" : birthdateToIso(input.jugador.birthdate),
    categoriaDetalle,
    leagueLogoUrl,
    federacionLogoUrl,
    photoUrl: fotoPublica,
    name: input.jugador.name,
    lastname: input.jugador.lastname,
    documentNumber,
    fechaNacimientoLabel,
    gender: input.jugador.gender,
    clubName: input.club.name,
    federationSportsCode: input.club.federationCode,
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
    carnetThemePreset: carnetTheme.preset,
    carnetSignatureMode: carnetTheme.signatureMode,
    carnetShowFederation: showFederation,
    carnetFederationDisplayName: leagueSettings?.carnetFederationDisplayName,
    carnetSportLabel: leagueSettings?.carnetSportLabel,
    carnetSportGraphicUrl,
    presentationMode: input.presentationMode,
  };
}
