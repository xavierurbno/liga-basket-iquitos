/**
 * Textos de cabecera y columnas compartidos entre el PDF y la vista previa en pantalla.
 */

export const FICHA_T1 = "FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL";
export const FICHA_T2 = "LIGA DEPORTIVA DISTRITAL DE BASKET DE IQUITOS";
export const FICHA_T2_AFILIACION = "Afiliada a la Federación Deportiva Peruana de Basketball";
export const FICHA_T3 = "FICHA DE INSCRIPCIÓN";

/** Nombres históricos o de BD que deben mostrarse con el título institucional de Iquitos. */
const IQUITOS_LEAGUE_TITLE_ALIASES = new Set([
  "liga deportiva de baloncesto de iquitos",
  "liga deportiva distrital mixta de basket de iquitos",
  "liga de basket de iquitos",
]);

/** Línea T2 de cabecera según la liga operativa (fallback Iquitos). */
export function resolveFichaLeagueTitle(leagueDisplayName?: string | null): string {
  const name = leagueDisplayName?.trim();
  if (!name) return FICHA_T2;
  const key = name.toLowerCase();
  if (key === FICHA_T2.toLowerCase() || IQUITOS_LEAGUE_TITLE_ALIASES.has(key)) {
    return FICHA_T2;
  }
  return name.toUpperCase();
}

/** Encabezados de tabla (orden idéntico al PDF). */
export const FICHA_COLUMNAS_TABLA = [
  "N°",
  "APELLIDOS Y NOMBRES",
  "DOCUMENTO",
  "FECHA DE NACIMIENTO",
  "EDAD",
  "N° POLO",
  "FOTO",
  "QR",
] as const;
