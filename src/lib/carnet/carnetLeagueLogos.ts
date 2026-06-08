import { isClasicaReversoCarnetPreset } from "@/lib/carnet/carnetPresetConfig";
import type { CarnetThemePreset } from "@/lib/carnet/carnetTheme";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";

export type CarnetLeagueLogoSlice = {
  ligaLogoPngDataUrl: string | null;
  ligaLogoMonoPngDataUrl?: string | null;
  leagueSlug?: string | null;
  theme: { preset: CarnetThemePreset };
};

export type CarnetFederationLogoSlice = {
  federacionLogoPngDataUrl: string | null;
  federacionLogoMonoPngDataUrl?: string | null;
  leagueSlug?: string | null;
  theme: { preset: CarnetThemePreset };
};

/** LDDBI/Iquitos: logos en anverso y reverso; demás ligas: solo anverso. */
export function shouldShowCarnetLogoOnFace(
  leagueSlug: string | null | undefined,
  face: "anverso" | "reverso",
): boolean {
  if (face === "anverso") return true;
  return isPrimaryPortalLeagueSlug(leagueSlug);
}

/** Logo de liga según cara, preset y slug de liga. */
export function resolveLigaLogoPngForCarnetFace(
  input: CarnetLeagueLogoSlice,
  face: "anverso" | "reverso",
): string | null {
  if (!shouldShowCarnetLogoOnFace(input.leagueSlug, face)) return null;
  if (face === "reverso" && isClasicaReversoCarnetPreset(input.theme.preset)) {
    return input.ligaLogoMonoPngDataUrl ?? input.ligaLogoPngDataUrl;
  }
  return input.ligaLogoPngDataUrl;
}

/** Federación a color en anverso; B/N en reverso clásico (solo liga primaria). */
export function resolveFederacionLogoPngForCarnetFace(
  input: CarnetFederationLogoSlice,
  face: "anverso" | "reverso",
): string | null {
  if (!shouldShowCarnetLogoOnFace(input.leagueSlug, face)) return null;
  if (face === "reverso" && isClasicaReversoCarnetPreset(input.theme.preset)) {
    return input.federacionLogoMonoPngDataUrl ?? input.federacionLogoPngDataUrl;
  }
  return input.federacionLogoPngDataUrl;
}
