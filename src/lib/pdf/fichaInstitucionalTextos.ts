/**
 * Textos de cabecera y columnas compartidos entre el PDF y la vista previa en pantalla.
 */

export const FICHA_T1 = "FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL";
export const FICHA_T2 = "LIGA DEPORTIVA DISTRITAL MIXTA DE BASKET DE IQUITOS";
export const FICHA_T2_AFILIACION = "Afiliada a la Federación Deportiva Peruana de Basketball";
export const FICHA_T3 = "FICHA DE INSCRIPCIÓN";

/** Línea T2 de cabecera según la liga operativa (fallback Iquitos). */
export function resolveFichaLeagueTitle(leagueDisplayName?: string | null): string {
  const name = leagueDisplayName?.trim();
  return name ? name.toUpperCase() : FICHA_T2;
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
] as const;
