import type { CarnetThemePreset } from "@/lib/carnet/carnetTheme";

export type CarnetPresetFilePaths = {
  anverso: readonly string[];
  reverso: readonly string[];
  anversoPublicPath: string;
  reversoPublicPath: string;
};

const SHARED_CLASICA_REVERSO = [
  "carnet",
  "presets",
  "_shared",
  "clasica-reverso-template.png",
] as const;

/** Rutas en `public/` por preset (anverso y reverso pueden ser carpetas distintas). */
export const CARNET_PRESET_FILES: Record<CarnetThemePreset, CarnetPresetFilePaths> = {
  lddbi_template: {
    anverso: ["carnet", "lddbi-template", "anverso-template.png"],
    reverso: ["carnet", "lddbi-template", "reverso-template.png"],
    anversoPublicPath: "/carnet/lddbi-template/anverso-template.png",
    reversoPublicPath: "/carnet/lddbi-template/reverso-template.png",
  },
  esquinas_color: {
    anverso: ["carnet", "presets", "esquinas-color", "anverso-template.png"],
    reverso: ["carnet", "presets", "esquinas-color", "reverso-template.png"],
    anversoPublicPath: "/carnet/presets/esquinas-color/anverso-template.png",
    reversoPublicPath: "/carnet/presets/esquinas-color/reverso-template.png",
  },
  esquinas_clasica_reverso: {
    anverso: ["carnet", "presets", "esquinas-color", "anverso-template.png"],
    reverso: [...SHARED_CLASICA_REVERSO],
    anversoPublicPath: "/carnet/presets/esquinas-color/anverso-template.png",
    reversoPublicPath: "/carnet/presets/_shared/clasica-reverso-template.png",
  },
  onda_color: {
    anverso: ["carnet", "presets", "onda-color", "anverso-template.png"],
    reverso: ["carnet", "presets", "onda-color", "reverso-template.png"],
    anversoPublicPath: "/carnet/presets/onda-color/anverso-template.png",
    reversoPublicPath: "/carnet/presets/onda-color/reverso-template.png",
  },
  onda_clasica_reverso: {
    anverso: ["carnet", "presets", "onda-color", "anverso-template.png"],
    reverso: [...SHARED_CLASICA_REVERSO],
    anversoPublicPath: "/carnet/presets/onda-color/anverso-template.png",
    reversoPublicPath: "/carnet/presets/_shared/clasica-reverso-template.png",
  },
};

export function getCarnetPresetFilePaths(preset: CarnetThemePreset): CarnetPresetFilePaths {
  return CARNET_PRESET_FILES[preset];
}

/** Todos los presets activos usan superposición PNG + layout LDDBI. */
export function isPngTemplateCarnetPreset(preset: string | null | undefined): preset is CarnetThemePreset {
  return Boolean(preset && preset in CARNET_PRESET_FILES);
}

/** Presets con reverso blanco institucional (`_shared/clasica-reverso-template.png`). */
export function isClasicaReversoCarnetPreset(preset: string | null | undefined): boolean {
  return preset === "esquinas_clasica_reverso" || preset === "onda_clasica_reverso";
}
