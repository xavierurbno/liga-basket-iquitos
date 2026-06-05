import {
  buildCarnetAuthorizationText,
  resolveCarnetValidityLabel,
  splitApellidosParaCarnet,
} from "@/lib/carnet/carnetInstitucionalText";
import { resolveCarnetThemeConfig } from "@/lib/carnet/carnetTheme";
import {
  DEFAULT_PDF_ACCENT_RGB,
  DEFAULT_PDF_PRIMARY_RGB,
} from "@/lib/pdf/brand-colors";
import type {
  BuildCarnetPdfImageAssetsResult,
  CarnetInstitucionalInput,
  CarnetJugadorPdfInput,
  CarnetPlayerGender,
  GenerateCarnetPDFProps,
} from "@/lib/types/carnet";

export function fallbackCarnetInstitucionalInput(
  leagueDisplayName: string,
): CarnetInstitucionalInput {
  const name = leagueDisplayName.trim() || "Liga deportiva";
  return {
    leagueDisplayName: name,
    vigenciaLabel: resolveCarnetValidityLabel(),
    presidentDisplayName: "",
    secretaryDisplayName: "",
    authorizationText: buildCarnetAuthorizationText(name),
    primaryRgb: DEFAULT_PDF_PRIMARY_RGB,
    accentRgb: DEFAULT_PDF_ACCENT_RGB,
    theme: resolveCarnetThemeConfig(null),
  };
}

export function buildCarnetJugadorPdfInput(
  props: GenerateCarnetPDFProps,
  assets: BuildCarnetPdfImageAssetsResult,
  institucional: CarnetInstitucionalInput,
  baseOrigin: string,
): CarnetJugadorPdfInput {
  const { apellidoPaterno, apellidoMaterno } = splitApellidosParaCarnet(props.lastname);
  const gender: CarnetPlayerGender = props.gender ?? "MASCULINO";

  return {
    ...institucional,
    ...assets,
    playerId: props.playerId,
    name: props.name,
    lastname: props.lastname,
    apellidoPaterno,
    apellidoMaterno,
    documentType: props.documentType,
    documentNumber: props.documentNumber,
    fechaNacimientoIso: props.fechaNacimientoIso,
    gender,
    clubName: props.clubName,
    federationSportsCode: props.federationSportsCode?.trim() || null,
    leagueSportsCode: props.leagueSportsCode?.trim() || null,
    categoriaNombre: props.categoriaDetalle,
    carnetNumber: props.carnetNumberDisplay ?? props.carnetNumber,
    validationUrl: props.validationUrl?.trim() || null,
    generatedAtIso: props.credentialIssuedAtIso?.trim() || new Date().toISOString(),
  };
}
