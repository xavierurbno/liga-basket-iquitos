/** Utilidades de color del portal — seguras para cliente y servidor. */

export const DEFAULT_PORTAL_PRIMARY = "#1e3a5f";
export const DEFAULT_PORTAL_ACCENT = "#005CEE";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function normalizePortalHexColor(value: string | null | undefined, fallback: string): string {
  const v = value?.trim();
  if (v && HEX_RE.test(v)) return v.toLowerCase();
  return fallback;
}
