import { isClasicaReversoCarnetPreset } from "@/lib/carnet/carnetPresetConfig";
import type { CarnetThemePreset } from "@/lib/carnet/carnetTheme";

export type CarnetLeagueLogoSlice = {
  ligaLogoPngDataUrl: string | null;
  ligaLogoMonoPngDataUrl?: string | null;
  theme: { preset: CarnetThemePreset };
};

export type CarnetFederationLogoSlice = {
  federacionLogoPngDataUrl: string | null;
  federacionLogoMonoPngDataUrl?: string | null;
  theme: { preset: CarnetThemePreset };
};

/** Logo de liga según cara y preset (B/N solo en reverso clásico). */
export function resolveLigaLogoPngForCarnetFace(
  input: CarnetLeagueLogoSlice,
  face: "anverso" | "reverso",
): string | null {
  if (face === "reverso" && isClasicaReversoCarnetPreset(input.theme.preset)) {
    return input.ligaLogoMonoPngDataUrl ?? input.ligaLogoPngDataUrl;
  }
  return input.ligaLogoPngDataUrl;
}

/** Federación a color en anverso; B/N en reverso clásico (ZC300). */
export function resolveFederacionLogoPngForCarnetFace(
  input: CarnetFederationLogoSlice,
  face: "anverso" | "reverso",
): string | null {
  if (face === "reverso" && isClasicaReversoCarnetPreset(input.theme.preset)) {
    return input.federacionLogoMonoPngDataUrl ?? input.federacionLogoPngDataUrl;
  }
  return input.federacionLogoPngDataUrl;
}
