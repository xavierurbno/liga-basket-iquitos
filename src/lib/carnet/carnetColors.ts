import { hexToRgbTuple } from "@/lib/pdf/brand-colors";

/** Crema/amarillo pálido del carnet físico de referencia (Iquitos). */
export const DEFAULT_CARNET_BG_RGB: [number, number, number] = [245, 230, 184];
export const DEFAULT_CARNET_BG_HEX = "#F5E6B8";

const CREAM_RGB: [number, number, number] = DEFAULT_CARNET_BG_RGB;

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Fondo del carnet: crema base + ligero tinte del color primario de la liga. */
export function resolveCarnetBackgroundRgb(
  primaryRgb?: [number, number, number] | null,
): [number, number, number] {
  if (!primaryRgb) return CREAM_RGB;
  const blend = 0.18;
  return [
    Math.round(CREAM_RGB[0] * (1 - blend) + primaryRgb[0] * blend),
    Math.round(CREAM_RGB[1] * (1 - blend) + primaryRgb[1] * blend),
    Math.round(CREAM_RGB[2] * (1 - blend) + primaryRgb[2] * blend),
  ];
}

export function resolveCarnetBackgroundHex(portalPrimaryColor?: string | null): string {
  const primary = hexToRgbTuple(portalPrimaryColor) ?? [30, 58, 95];
  return rgbToHex(resolveCarnetBackgroundRgb(primary));
}

/** Borde / separadores un poco más oscuros que el fondo. */
export function resolveCarnetBorderRgb(bgRgb: [number, number, number]): [number, number, number] {
  return [
    Math.max(0, bgRgb[0] - 35),
    Math.max(0, bgRgb[1] - 38),
    Math.max(0, bgRgb[2] - 42),
  ];
}

/** Panel blanco semitransparente para foto y QR (simula papel sobre color). */
export const CARNET_PANEL_RGB: [number, number, number] = [255, 255, 255];

export function extractCarnetYear(carnetNumber: string | null | undefined): string {
  const parts = carnetNumber?.trim().split("-") ?? [];
  const yearSeg = parts[1];
  if (yearSeg && /^\d{4}$/.test(yearSeg)) return yearSeg;
  return String(new Date().getFullYear());
}
