import type { CarnetThemeConfig, CarnetThemePreset } from "@/lib/carnet/carnetTheme";

export type CarnetPlayerGender = "MASCULINO" | "FEMENINO" | "MIXTO";

export type { CarnetThemeConfig, CarnetThemePreset };

export type GenerateCarnetPDFProps = {
  leagueId?: string | null;
  leagueDisplayName?: string;
  /** Número de carnet ya formateado con prefijo de la liga (pantalla/PDF). */
  carnetNumberDisplay?: string | null;
  playerId: string;
  fileName: string;
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  fechaNacimientoIso: string;
  gender?: CarnetPlayerGender;
  clubName: string;
  /** Código del club ante la federación (clubs.federation_code). */
  federationSportsCode?: string | null;
  /** Código de la liga deportiva (prefijo sede, ej. IQ). */
  leagueSportsCode?: string | null;
  categoriaDetalle: string;
  carnetNumber: string | null;
  photoUrl: string | null;
  clubLogoUrl: string | null;
  /** URL firmada `/validar` (generada en servidor). */
  validationUrl?: string | null;
  /** Fecha de emisión registrada en BD (trazabilidad en PDF). */
  credentialIssuedAtIso?: string | null;
  credentialVersion?: number;
  /** Etiqueta del botón (tabla vs página dedicada). */
  label?: string;
  className?: string;
  disabled?: boolean;
};

/** Datos del deportista para el motor PDF (sin assets rasterizados). */
export type CarnetDeportistaInput = {
  playerId: string;
  name: string;
  lastname: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  documentType: string;
  documentNumber: string;
  fechaNacimientoIso: string;
  gender: CarnetPlayerGender;
  clubName: string;
  federationSportsCode: string | null;
  leagueSportsCode: string | null;
  categoriaNombre: string;
  carnetNumber: string | null;
  validationUrl: string | null;
};

/** Textos y autoridades de la liga (reverso / encabezado). */
export type CarnetInstitucionalInput = {
  leagueDisplayName: string;
  vigenciaLabel: string;
  presidentDisplayName: string;
  secretaryDisplayName: string;
  authorizationText: string;
  primaryRgb: [number, number, number];
  accentRgb: [number, number, number];
  theme: CarnetThemeConfig;
};

/** Imágenes listas para jsPDF (data URLs escaladas). */
export type CarnetPdfImageAssets = {
  fotoPngDataUrl: string | null;
  ligaLogoPngDataUrl: string | null;
  federacionLogoPngDataUrl: string | null;
  sportGraphicPngDataUrl: string | null;
  clubLogoPngDataUrl: string | null;
  presidentSignaturePngDataUrl: string | null;
  secretarySignaturePngDataUrl: string | null;
  validationQrPngDataUrl: string | null;
  /** Plantilla PNG mockup (`lddbi_template`). */
  anversoTemplatePngDataUrl?: string | null;
  reversoTemplatePngDataUrl?: string | null;
};

/** Input completo para generación PDF v2 (fases C+). */
export type CarnetJugadorPdfInput = CarnetDeportistaInput &
  CarnetInstitucionalInput &
  CarnetPdfImageAssets & {
    generatedAtIso?: string;
  };

export type CarnetInstitutionalAssetUrls = {
  ligaLogoUrl: string | null;
  federacionLogoUrl: string | null;
  presidentSignatureUrl: string | null;
  secretarySignatureUrl: string | null;
};

export type CarnetInstitutionalContext = CarnetInstitucionalInput;

export type CarnetInstitutionalAssetsSuccess = {
  success: true;
  context: CarnetInstitutionalContext;
  urls: CarnetInstitutionalAssetUrls;
  ligaLogoPngDataUrl: string | null;
  federacionLogoPngDataUrl: string | null;
  sportGraphicPngDataUrl: string | null;
  presidentSignaturePngDataUrl: string | null;
  secretarySignaturePngDataUrl: string | null;
  anversoTemplatePngDataUrl?: string | null;
  reversoTemplatePngDataUrl?: string | null;
};

export type CarnetInstitutionalAssetsResult =
  | CarnetInstitutionalAssetsSuccess
  | { success: false; error: string };

export type BuildCarnetPdfImageAssetsParams = {
  photoUrl: string | null;
  clubLogoUrl: string | null;
  playerId: string;
  /** URL firmada de validación (emitida en servidor). */
  validationUrl?: string | null;
  baseOrigin: string;
  ligaLogoPngDataUrl: string | null;
  federacionLogoPngDataUrl?: string | null;
  sportGraphicPngDataUrl?: string | null;
  presidentSignaturePngDataUrl?: string | null;
  secretarySignaturePngDataUrl?: string | null;
};

export type BuildCarnetPdfImageAssetsResult = CarnetPdfImageAssets;

/** Vista previa HTML del carnet CR80 (anverso + reverso). */
export type CarnetVistaPreviaProps = {
  /** Liga operativa (assets institucionales / plantillas PNG). */
  leagueId?: string | null;
  playerId: string;
  leagueDisplayName: string;
  leagueLogoUrl: string | null;
  federacionLogoUrl: string | null;
  photoUrl: string | null;
  name: string;
  lastname: string;
  documentNumber: string;
  documentType?: string;
  fechaNacimientoLabel: string;
  /** ISO para el motor PDF (misma fecha que la etiqueta en pantalla). */
  fechaNacimientoIso?: string;
  /** Línea de categoría del PDF; si no viene, se usa `categoriaNombre`. */
  categoriaDetalle?: string;
  clubLogoUrl?: string | null;
  gender: CarnetPlayerGender;
  clubName: string;
  federationSportsCode?: string | null;
  leagueSportsCode?: string | null;
  categoriaNombre: string;
  carnetNumberDisplay: string | null;
  presidentDisplayName: string;
  secretaryDisplayName: string;
  presidentSignatureUrl: string | null;
  secretarySignatureUrl: string | null;
  authorizationText: string;
  vigenciaLabel: string;
  validationUrl: string | null;
  portalPrimaryColor?: string;
  portalAccentColor?: string;
  carnetThemePreset?: CarnetThemePreset;
  carnetShowFederation?: boolean;
  carnetFederationDisplayName?: string | null;
  carnetSportLabel?: string | null;
  carnetSportGraphicUrl?: string | null;
  /** `validacion`: solo anverso, sin controles de panel admin (/validar jugador). */
  presentationMode?: "admin" | "validacion";
};
