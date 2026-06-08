import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";
import { resolveFichaLeagueTitle } from "@/lib/pdf/fichaInstitucionalTextos";
import { LDDBI_FONT } from "@/lib/carnet/lddbiPremiumTheme";

/** Texto institucional por defecto (solo liga LDDBI / Iquitos). */
export const LDDBI_FEDERATION_HEADER_LINE =
  "FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL";

export const LDDBI_LEAGUE_HEADER_LINE_DEFAULT =
  "LIGA DEPORTIVA DISTRITAL DE BASKET DE IQUITOS";

export type LddbiHeaderLayout = "dual" | "single-prominent";

export type LddbiEncabezadoLineas = {
  lineaFederacion: string | null;
  lineaLiga: string;
  headerLayout: LddbiHeaderLayout;
};

/** Alturas en mm para vista previa HTML (plantilla PNG). */
export const LDDBI_HEADER_PREVIEW_MM = {
  dualFed: 1.85,
  dualLiga: 1.65,
  singleProminent: 2.4,
} as const;

export function lddbiHeaderPdfFontPt(
  layout: LddbiHeaderLayout,
  line: "fed" | "liga",
): number {
  if (layout === "single-prominent") return 7.2;
  return line === "fed" ? LDDBI_FONT.headerFed : LDDBI_FONT.headerLiga;
}

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
  leagueSlug?: string | null,
  sportLabel?: string | null,
): LddbiEncabezadoLineas {
  const lineaLiga = resolveLddbiLigaHeaderLine(leagueDisplayName);
  const customFed = federationDisplayName?.trim();
  const isPrimary = isPrimaryPortalLeagueSlug(leagueSlug);
  const sport = sportLabel?.trim();

  if (!showFederation) {
    return { lineaFederacion: null, lineaLiga, headerLayout: "single-prominent" };
  }

  if (customFed) {
    return {
      lineaFederacion: customFed.toUpperCase(),
      lineaLiga,
      headerLayout: "dual",
    };
  }

  if (isPrimary) {
    return {
      lineaFederacion: LDDBI_FEDERATION_HEADER_LINE,
      lineaLiga,
      headerLayout: "dual",
    };
  }

  if (sport) {
    return {
      lineaFederacion: sport.toUpperCase(),
      lineaLiga,
      headerLayout: "dual",
    };
  }

  return { lineaFederacion: null, lineaLiga, headerLayout: "single-prominent" };
}

export function resolveLddbiReversoLineas(
  leagueDisplayName: string,
  federationDisplayName?: string | null,
  showFederation = true,
  leagueSlug?: string | null,
  sportLabel?: string | null,
): LddbiEncabezadoLineas {
  return resolveLddbiEncabezadoLineas(
    leagueDisplayName,
    federationDisplayName,
    showFederation,
    leagueSlug,
    sportLabel,
  );
}
