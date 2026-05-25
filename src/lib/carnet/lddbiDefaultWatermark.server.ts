import "server-only";

import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const WATERMARK_REL = ["carnet", "lddbi-basketball-watermark.svg"];

let cachedDataUrl: string | null = null;

/** Marca de agua de balón por defecto (solo servidor). */
export async function resolveDefaultLddbiBasketballWatermarkPng(): Promise<string | null> {
  if (cachedDataUrl) return cachedDataUrl;
  try {
    const filePath = path.join(process.cwd(), "public", ...WATERMARK_REL);
    const svg = await fs.readFile(filePath);
    const png = await sharp(svg).png().resize(520, 520, { fit: "contain" }).toBuffer();
    cachedDataUrl = `data:image/png;base64,${png.toString("base64")}`;
    return cachedDataUrl;
  } catch {
    return null;
  }
}
