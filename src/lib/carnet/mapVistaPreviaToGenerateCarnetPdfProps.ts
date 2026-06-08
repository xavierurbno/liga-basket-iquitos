import { isCarnetValidacionMode } from "@/lib/carnet/isCarnetValidacionMode";
import { extractValidationTokenFromUrl } from "@/lib/validation/extract-validation-token";
import type { CarnetVistaPreviaProps, GenerateCarnetPDFProps } from "@/lib/types/carnet";

export type CarnetVistaPreviaPdfExtras = {
  leagueId?: string | null;
  fechaNacimientoIso?: string;
  documentType?: string;
  /**
   * Detalle largo de la categoría (p. ej. «U 11 MIXTO - MIXTO») generado por
   * `lineaCategoriaInstitucional`. NO se usa para el carnet LDDBI (la fila
   * «CATEGORÍA» espera el nombre limpio para evitar duplicar el género). Se
   * conserva por compatibilidad con otros presets que lo consuman.
   */
  categoriaDetalle?: string;
  clubLogoUrl?: string | null;
  fileName?: string;
};

/** Props idénticas a las del botón de descarga PDF. */
export function mapVistaPreviaToGenerateCarnetPdfProps(
  props: CarnetVistaPreviaProps,
  extras: CarnetVistaPreviaPdfExtras = {},
): GenerateCarnetPDFProps {
  const fileName =
    extras.fileName ??
    `carnet-${props.documentNumber}`.replace(/[^a-zA-Z0-9._-]/g, "-");

  const validationTokenForPublicAssets = isCarnetValidacionMode(props)
    ? extractValidationTokenFromUrl(props.validationUrl)
    : null;

  return {
    leagueId: extras.leagueId,
    leagueDisplayName: props.leagueDisplayName,
    playerId: props.playerId,
    fileName,
    name: props.name,
    lastname: props.lastname,
    documentType: extras.documentType ?? "DNI",
    documentNumber: props.documentNumber,
    fechaNacimientoIso: extras.fechaNacimientoIso ?? "",
    gender: props.gender,
    clubName: props.clubName,
    federationSportsCode: props.federationSportsCode,
    leagueSportsCode: props.leagueSportsCode,
    // Prioriza nombre limpio para evitar duplicar el género (p. ej. «U 11 MIXTO - MIXTO»).
    categoriaDetalle: props.categoriaNombre || extras.categoriaDetalle || "",
    carnetNumber: props.carnetNumberDisplay,
    carnetNumberDisplay: props.carnetNumberDisplay,
    photoUrl: props.photoUrl,
    clubLogoUrl: extras.clubLogoUrl ?? null,
    validationUrl: props.validationUrl,
    validationTokenForPublicAssets,
  };
}
