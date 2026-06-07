import type { CarnetThemePreset } from "@/lib/carnet/carnetTheme";
import { hexToRgbTuple } from "@/lib/pdf/brand-colors";

const BLACK_RGB: [number, number, number] = [0, 0, 0];
const GOLD_RGB: [number, number, number] = [201, 162, 39];
const WHITE_RGB: [number, number, number] = [255, 255, 255];
const HEADER_LIGA_RGB: [number, number, number] = [248, 252, 255];
const REVERSO_MUTED_RGB: [number, number, number] = [220, 228, 238];
const REVERSO_MUTED_DARK_RGB: [number, number, number] = [55, 65, 75];

/** Rojo dominante del PNG de cada preset (muestreado de las plantillas en public/). */
const PRESET_ACCENT_HEX: Record<Exclude<CarnetThemePreset, "lddbi_template">, string> = {
  esquinas_color: "#D80F0F",
  esquinas_clasica_reverso: "#D80F0F",
  onda_color: "#B51515",
  onda_clasica_reverso: "#B51515",
};

export type CarnetOverlayColors = {
  labelRgb: [number, number, number];
  valueRgb: [number, number, number];
  headerFedRgb: [number, number, number];
  headerLigaRgb: [number, number, number];
  identificacionRgb: [number, number, number];
  reversoTextRgb: [number, number, number];
  reversoMutedRgb: [number, number, number];
  photoFrameRgb: [number, number, number];
};

export function isLightPngCarnetPreset(preset: CarnetThemePreset): boolean {
  return preset !== "lddbi_template";
}

export function resolveCarnetOverlayColors(
  preset: CarnetThemePreset,
  themeAccentRgb: [number, number, number],
): CarnetOverlayColors {
  if (!isLightPngCarnetPreset(preset)) {
    return {
      labelRgb: GOLD_RGB,
      valueRgb: WHITE_RGB,
      headerFedRgb: WHITE_RGB,
      headerLigaRgb: HEADER_LIGA_RGB,
      identificacionRgb: WHITE_RGB,
      reversoTextRgb: WHITE_RGB,
      reversoMutedRgb: REVERSO_MUTED_RGB,
      photoFrameRgb: themeAccentRgb,
    };
  }

  const accentHex = PRESET_ACCENT_HEX[preset as Exclude<CarnetThemePreset, "lddbi_template">];
  const photoFrameRgb = hexToRgbTuple(accentHex) ?? [216, 15, 15];

  return {
    labelRgb: BLACK_RGB,
    valueRgb: BLACK_RGB,
    headerFedRgb: BLACK_RGB,
    headerLigaRgb: BLACK_RGB,
    identificacionRgb: BLACK_RGB,
    reversoTextRgb: BLACK_RGB,
    reversoMutedRgb: REVERSO_MUTED_DARK_RGB,
    photoFrameRgb,
  };
}
