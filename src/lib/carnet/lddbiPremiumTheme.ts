/** Paleta fija del carnet LDDBI premium (independiente del portal). */
export const LDDBI_PREMIUM_PRIMARY_HEX = "#1e3a5f";
export const LDDBI_PREMIUM_ACCENT_HEX = "#0d9488";

/** QR reverso LDDBI — más compacto que el genérico (13 mm). */
export const LDDBI_QR_REVERSO_MM = 10;

/** Layout anverso (mm). */
export const LDDBI_HEADER_MM = 12;
export const LDDBI_ACCENT_BAND_MM = 4.2;
/** Recuadro cuadrado cabecera (federación izq., liga der.) — mismo ancho y alto. */
export const LDDBI_HEADER_LOGO_MM = 10;
export const LDDBI_FED_LOGO_MM = LDDBI_HEADER_LOGO_MM;
export const LDDBI_LEAGUE_LOGO_MM = LDDBI_HEADER_LOGO_MM;
/** Alias genérico (reverso / pie). */
export const LDDBI_LOGO_MM = LDDBI_HEADER_LOGO_MM;

/** Cabecera azul del reverso (logos + textos institucionales + vigencia). */
export const LDDBI_REV_TOP_MM = 12;
export const LDDBI_REV_QR_ZONE_MM = 21;
export const LDDBI_REV_BOTTOM_BAR_MM = 5.5;

/** Tipografía PDF anverso (pt aprox. en jsPDF). */
export const LDDBI_FONT = {
  headerFed: 6.2,
  headerLiga: 5.4,
  label: 5.6,
  value: 7.2,
  valueDestacado: 7.8,
  fotoLabel: 4.1,
  fotoNumero: 5.1,
  fotoGenero: 5.4,
  fotoAnio: 6.2,
  banda: 5.8,
} as const;

/** Tipografía PDF reverso. */
export const LDDBI_FONT_REV = {
  reversoFed: 4.9,
  reversoLiga: 4.3,
  vigenciaTitulo: 5.6,
  vigenciaValor: 4.8,
  legal: 4.9,
  firmaNombre: 5,
  firmaCargo: 4.2,
  vigenciaHasta: 5,
  pieCodigo: 4,
  pieFed: 3.4,
} as const;
