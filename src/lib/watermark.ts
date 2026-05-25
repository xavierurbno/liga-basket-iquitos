import sharp from "sharp";
import { resolveLeagueLogoBuffer } from "@/lib/logos/resolve-league-logo-buffer";

/**
 * Marca de agua en galería: logo de la liga (`login_logo_url`) o fallback global.
 */
export async function applyWatermark(
  inputBuffer: Buffer,
  opts?: { leagueId?: string | null },
): Promise<Buffer> {
  const logoBuffer = await resolveLeagueLogoBuffer(opts?.leagueId);

  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("No se pudieron obtener las dimensiones de la imagen original.");
  }

  // 3. Lógica de Redimensión al 18%
  const watermarkWidth = Math.round(metadata.width * 0.18);
  
  // Evitar procesar imágenes demasiado pequeñas que romperían el padding
  if (metadata.width < 150 || metadata.height < 150) {
    return inputBuffer;
  }

  // Sin logo (liga sin login_logo_url y sin fallback): devolver original sin marca de agua.
  if (!logoBuffer) {
    return inputBuffer;
  }

  // 4. Pre-procesamiento de Firma con Opacidad 50%
  // Usamos .linear() para multiplicar el canal alpha por 0.5 conservando los colores (RGB) intactos.
  // Esto evita el efecto de "sombra" u oscurecimiento.
  const translucentLogo = await sharp(logoBuffer)
    .resize({ width: watermarkWidth })
    .ensureAlpha()
    .linear([1, 1, 1, 0.5], [0, 0, 0, 0])
    .png()
    .toBuffer();
  
  const finalLogoMetadata = await sharp(translucentLogo).metadata();
  const lw = finalLogoMetadata.width!;
  const lh = finalLogoMetadata.height!;

  // 5. Posicionamiento en Esquina SE con Padding de 25px
  const posX = Math.max(0, metadata.width - lw - 25);
  const posY = Math.max(0, metadata.height - lh - 25);

  return await image
    .composite([
      {
        input: translucentLogo,
        left: posX,
        top: posY,
        blend: "over",
      },
    ])
    .withMetadata() // Preserva metadatos originales (EXIF, etc)
    .jpeg({ quality: 92 }) // Salida en JPG de alta calidad
    .toBuffer();
}
