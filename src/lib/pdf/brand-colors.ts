/** Convierte `#RRGGBB` a tupla RGB para jsPDF. */
export function hexToRgbTuple(hex: string | null | undefined): [number, number, number] | null {
  const v = hex?.trim();
  if (!v || !/^#[0-9A-Fa-f]{6}$/.test(v)) return null;
  const n = parseInt(v.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const DEFAULT_PDF_PRIMARY_RGB: [number, number, number] = [30, 58, 95];
export const DEFAULT_PDF_ACCENT_RGB: [number, number, number] = [0, 92, 238];
