import {
  type CarnetSignatureMode,
  DEFAULT_CARNET_SIGNATURE_MODE,
  parseCarnetSignatureMode,
} from "@/lib/carnet/carnetSignatureMode";
import {
  LDDBI_PREMIUM_ACCENT_HEX,
  LDDBI_PREMIUM_PRIMARY_HEX,
} from "@/lib/carnet/lddbiPremiumTheme";
import { hexToRgbTuple } from "@/lib/pdf/brand-colors";
import {
  DEFAULT_PDF_ACCENT_RGB,
  DEFAULT_PDF_PRIMARY_RGB,
} from "@/lib/pdf/brand-colors";

/** Campos de `league_settings` usados por el tema del carnet (sin importar schema en cliente). */
export type CarnetThemeSettingsSlice = {
  carnetThemePreset?: string | null;
  carnetShowFederation?: boolean | null;
  carnetFederationDisplayName?: string | null;
  carnetSportLabel?: string | null;
  carnetSportGraphicUrl?: string | null;
  portalPrimaryColor?: string | null;
  portalAccentColor?: string | null;
  carnetSignatureMode?: string | null;
};

/** Plantillas CR80 disponibles en configuración de liga. */
export const CARNET_THEME_PRESETS = [
  "lddbi_template",
  "esquinas_color",
  "esquinas_clasica_reverso",
  "onda_color",
  "onda_clasica_reverso",
] as const;

export type CarnetThemePreset = (typeof CARNET_THEME_PRESETS)[number];

export const CARNET_THEME_PRESET_LABELS: Record<CarnetThemePreset, string> = {
  lddbi_template: "LDDBI — mockup oficial (full color)",
  esquinas_color: "Esquinas rojas — full color (anverso y reverso)",
  esquinas_clasica_reverso: "Esquinas rojas — dorso clásica blanco (ZC300)",
  onda_color: "Onda roja — full color (anverso y reverso)",
  onda_clasica_reverso: "Onda roja — dorso clásica blanco (ZC300)",
};

const DEFAULT_PRESET: CarnetThemePreset = "lddbi_template";

const LEGACY_PRESETS = new Set([
  "institutional_soft",
  "lddbi_bold",
  "federation_bar_sport",
]);

/** Normaliza preset guardado en BD (incluye valores legacy retirados). */
export function parseCarnetThemePreset(raw: string | null | undefined): CarnetThemePreset {
  const v = raw?.trim();
  if (v && (CARNET_THEME_PRESETS as readonly string[]).includes(v)) {
    return v as CarnetThemePreset;
  }
  if (v && LEGACY_PRESETS.has(v)) {
    return DEFAULT_PRESET;
  }
  return DEFAULT_PRESET;
}

/** Configuración visual del carnet por liga (Fase 0). */
export type CarnetThemeConfig = {
  preset: CarnetThemePreset;
  showFederation: boolean;
  federationDisplayName: string | null;
  sportLabel: string | null;
  sportGraphicUrl: string | null;
  signatureMode: CarnetSignatureMode;
  primaryRgb: [number, number, number];
  accentRgb: [number, number, number];
};

export type { CarnetSignatureMode };
export {
  CARNET_SIGNATURE_MODES,
  CARNET_SIGNATURE_MODE_LABELS,
  DEFAULT_CARNET_SIGNATURE_MODE,
  parseCarnetSignatureMode,
} from "@/lib/carnet/carnetSignatureMode";

export function resolveCarnetThemeConfig(
  settings: CarnetThemeSettingsSlice | null | undefined,
): CarnetThemeConfig {
  const preset = parseCarnetThemePreset(settings?.carnetThemePreset);
  const primaryHex = LDDBI_PREMIUM_PRIMARY_HEX;
  const accentHex = LDDBI_PREMIUM_ACCENT_HEX;

  return {
    preset,
    showFederation: settings?.carnetShowFederation !== false,
    federationDisplayName: settings?.carnetFederationDisplayName?.trim() || null,
    sportLabel: settings?.carnetSportLabel?.trim() || null,
    sportGraphicUrl: settings?.carnetSportGraphicUrl?.trim() || null,
    signatureMode: parseCarnetSignatureMode(
      settings?.carnetSignatureMode ?? DEFAULT_CARNET_SIGNATURE_MODE,
    ),
    primaryRgb: hexToRgbTuple(primaryHex) ?? DEFAULT_PDF_PRIMARY_RGB,
    accentRgb: hexToRgbTuple(accentHex) ?? DEFAULT_PDF_ACCENT_RGB,
  };
}

/** Líneas para bloque federación en reverso (máx. 2). */
export function splitFederationDisplayLines(
  federationDisplayName: string | null,
  showFederation: boolean,
): [string, string] | null {
  if (!showFederation) return null;
  const raw = federationDisplayName?.trim();
  if (raw) {
    const parts = raw.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return [parts[0], parts.slice(1).join(" ")];
    if (parts.length === 1) {
      const words = parts[0].split(/\s+/);
      if (words.length <= 4) return [parts[0], ""];
      const mid = Math.ceil(words.length / 2);
      return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
    }
  }
  return ["Federación Deportiva", "Peruana de Basketball"];
}
