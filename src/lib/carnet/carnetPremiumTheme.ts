import { hexToRgbTuple } from "@/lib/pdf/brand-colors";
import { resolveCarnetBackgroundRgb } from "@/lib/carnet/carnetColors";

export type CarnetPremiumPalette = {
  topRgb: [number, number, number];
  bottomRgb: [number, number, number];
  topHex: string;
  bottomHex: string;
  accentRgb: [number, number, number];
  accentHex: string;
  inkRgb: [number, number, number];
  mutedRgb: [number, number, number];
};

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Paleta sobria: degradado suave + acento institucional (primario de la liga). */
export function resolveCarnetPremiumPalette(
  primaryRgb?: [number, number, number] | null,
  accentRgb?: [number, number, number] | null,
  variant: "anverso" | "reverso" = "anverso",
): CarnetPremiumPalette {
  const base = resolveCarnetBackgroundRgb(primaryRgb);
  const top =
    variant === "anverso"
      ? lerpRgb([252, 251, 248], base, 0.35)
      : lerpRgb([250, 249, 246], [245, 243, 238], 0.5);
  const bottom =
    variant === "anverso"
      ? lerpRgb(base, primaryRgb ?? [30, 58, 95], 0.12)
      : lerpRgb([246, 244, 239], base, 0.25);
  const accent = accentRgb ?? primaryRgb ?? [30, 58, 95];

  return {
    topRgb: top,
    bottomRgb: bottom,
    topHex: rgbToHex(top),
    bottomHex: rgbToHex(bottom),
    accentRgb: accent,
    accentHex: rgbToHex(accent),
    inkRgb: [22, 28, 36],
    mutedRgb: [72, 78, 88],
  };
}

export function resolveCarnetPremiumPaletteFromHex(
  portalPrimaryColor?: string | null,
  portalAccentColor?: string | null,
  variant: "anverso" | "reverso" = "anverso",
): CarnetPremiumPalette {
  return resolveCarnetPremiumPalette(
    hexToRgbTuple(portalPrimaryColor) ?? undefined,
    hexToRgbTuple(portalAccentColor) ?? undefined,
    variant,
  );
}
