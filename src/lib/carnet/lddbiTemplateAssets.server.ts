import "server-only";

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  LDDBI_TEMPLATE_ANVERSO_PUBLIC_PATH,
  LDDBI_TEMPLATE_REVERSO_PUBLIC_PATH,
} from "@/lib/carnet/lddbiTemplatePaths";

const ANVERSO_FILE = ["carnet", "lddbi-template", "anverso-template.png"];
const REVERSO_FILE = ["carnet", "lddbi-template", "reverso-template.png"];

/** CR80 @ 300 DPI */
const TEMPLATE_PX = { w: 1011, h: 638 };

let cachedAnverso: string | null | undefined;
let cachedReverso: string | null | undefined;

async function fileToPngDataUrl(relParts: string[]): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), "public", ...relParts);
    const buf = await fs.readFile(filePath);
    const png = await sharp(buf)
      .resize(TEMPLATE_PX.w, TEMPLATE_PX.h, { fit: "fill" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export type LddbiTemplatePngAssets = {
  anversoTemplatePngDataUrl: string | null;
  reversoTemplatePngDataUrl: string | null;
  anversoTemplatePublicPath: string;
  reversoTemplatePublicPath: string;
};

/** Plantillas PNG del mockup LDDBI (solo servidor / generación PDF). */
export async function resolveLddbiTemplatePngAssets(): Promise<LddbiTemplatePngAssets> {
  if (cachedAnverso === undefined) {
    cachedAnverso = await fileToPngDataUrl(ANVERSO_FILE);
  }
  if (cachedReverso === undefined) {
    cachedReverso = await fileToPngDataUrl(REVERSO_FILE);
  }

  return {
    anversoTemplatePngDataUrl: cachedAnverso,
    reversoTemplatePngDataUrl: cachedReverso,
    anversoTemplatePublicPath: LDDBI_TEMPLATE_ANVERSO_PUBLIC_PATH,
    reversoTemplatePublicPath: LDDBI_TEMPLATE_REVERSO_PUBLIC_PATH,
  };
}
