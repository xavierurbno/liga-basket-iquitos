import "server-only";

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  getCarnetPresetFilePaths,
} from "@/lib/carnet/carnetPresetConfig";
import type { CarnetThemePreset } from "@/lib/carnet/carnetTheme";
import { parseCarnetThemePreset } from "@/lib/carnet/carnetTheme";

/** CR80 @ 300 DPI */
const TEMPLATE_PX = { w: 1011, h: 638 };

const cache = new Map<string, string | null>();

async function fileToPngDataUrl(relParts: readonly string[]): Promise<string | null> {
  const cacheKey = relParts.join("/");
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  try {
    const filePath = path.join(process.cwd(), "public", ...relParts);
    const buf = await fs.readFile(filePath);
    const png = await sharp(buf)
      .resize(TEMPLATE_PX.w, TEMPLATE_PX.h, { fit: "fill" })
      .png()
      .toBuffer();
    const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
    cache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}

export type CarnetTemplatePngAssets = {
  anversoTemplatePngDataUrl: string | null;
  reversoTemplatePngDataUrl: string | null;
  anversoTemplatePublicPath: string;
  reversoTemplatePublicPath: string;
};

/** Plantillas PNG del preset activo (servidor / generación PDF). */
export async function resolveCarnetTemplatePngAssets(
  presetInput?: CarnetThemePreset | string | null,
): Promise<CarnetTemplatePngAssets> {
  const preset = parseCarnetThemePreset(presetInput ?? undefined);
  const paths = getCarnetPresetFilePaths(preset);

  const [anversoTemplatePngDataUrl, reversoTemplatePngDataUrl] = await Promise.all([
    fileToPngDataUrl(paths.anverso),
    fileToPngDataUrl(paths.reverso),
  ]);

  return {
    anversoTemplatePngDataUrl,
    reversoTemplatePngDataUrl,
    anversoTemplatePublicPath: paths.anversoPublicPath,
    reversoTemplatePublicPath: paths.reversoPublicPath,
  };
}

/** @deprecated Usar `resolveCarnetTemplatePngAssets`. */
export async function resolveLddbiTemplatePngAssets(): Promise<CarnetTemplatePngAssets> {
  return resolveCarnetTemplatePngAssets("lddbi_template");
}
