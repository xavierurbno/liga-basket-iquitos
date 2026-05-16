import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

async function test() {
  const logoPath = path.join(process.cwd(), "public", "logo-liga.png");
  const outputPath = path.join(process.cwd(), "scratch", "test-opacity.png");

  try {
    const watermarkWidth = 500;
    const logoMetadata = await sharp(logoPath).metadata();
    const logoHeight = Math.round((logoMetadata.height! * watermarkWidth) / logoMetadata.width!);

    console.log("Generating translucent logo...");
    
    // El truco para opacidad al 50% conservando colores:
    // Creamos un fondo con alpha 0.5 y componemos el logo con 'dest-in'
    // 'dest-in' -> out_color = src_color * dest_alpha
    const watermarkLogo = await sharp({
      create: {
        width: watermarkWidth,
        height: logoHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.5 } // 50% alpha
      }
    })
    .composite([{
      input: await sharp(logoPath).resize({ width: watermarkWidth }).toBuffer(),
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

    await fs.writeFile(outputPath, watermarkLogo);
    console.log("Done. Check scratch/test-opacity.png");
  } catch (err) {
    console.error(err);
  }
}

test();
