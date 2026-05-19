import path from "path";
import fs from "fs/promises";

const WATERMARK_LOGO_CANDIDATES = ["logo-lddbi.png", "liga.png"] as const;

/**
 * Logo para marca de agua en galería. Prioriza logo-lddbi.png; si no existe, usa liga.png.
 */
export async function resolveWatermarkLogoPath(): Promise<string> {
  const logosDir = path.join(process.cwd(), "public", "logos");

  for (const fileName of WATERMARK_LOGO_CANDIDATES) {
    const candidate = path.join(logosDir, fileName);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // siguiente candidato
    }
  }

  throw new Error(
    `No se encontró logo para marca de agua en ${logosDir}. ` +
      `Añade ${WATERMARK_LOGO_CANDIDATES.join(" o ")} al repositorio (carpeta public/logos).`,
  );
}
