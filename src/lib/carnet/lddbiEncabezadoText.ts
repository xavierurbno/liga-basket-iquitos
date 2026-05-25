import { resolveFichaLeagueTitle } from "@/lib/pdf/fichaInstitucionalTextos";

/** Texto institucional por defecto (carnet LDDBI / Iquitos). */
export const LDDBI_FEDERATION_HEADER_LINE =
  "FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL";

export const LDDBI_LEAGUE_HEADER_LINE_DEFAULT =
  "LIGA DEPORTIVA DISTRITAL DE BASKET DE IQUITOS";

function resolveLddbiLigaHeaderLine(leagueDisplayName?: string | null): string {
  const fromTitle = resolveFichaLeagueTitle(leagueDisplayName);
  if (/IQUITOS/i.test(fromTitle)) {
    return LDDBI_LEAGUE_HEADER_LINE_DEFAULT;
  }
  return fromTitle;
}

export function resolveLddbiEncabezadoLineas(
  leagueDisplayName: string,
  federationDisplayName?: string | null,
  showFederation = true,
): { lineaFederacion: string; lineaLiga: string } {
  const lineaLiga = resolveLddbiLigaHeaderLine(leagueDisplayName);
  const lineaFederacion = (
    federationDisplayName?.trim() || LDDBI_FEDERATION_HEADER_LINE
  ).toUpperCase();

  return { lineaFederacion, lineaLiga };
}

export function resolveLddbiReversoLineas(leagueDisplayName: string): {
  lineaFederacion: string;
  lineaLiga: string;
} {
  return {
    lineaFederacion: LDDBI_FEDERATION_HEADER_LINE,
    lineaLiga: resolveLddbiLigaHeaderLine(leagueDisplayName),
  };
}
