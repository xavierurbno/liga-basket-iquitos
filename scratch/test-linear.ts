import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

async function test() {
  const logoPath = path.join(process.cwd(), "public", "logos", "logo-lddbi.png");
  const outputPath = path.join(process.cwd(), "scratch", "test-linear.png");

  try {
    const watermarkWidth = 500;
    
    console.log("Generating translucent logo with .linear()...");
    
    const translucentLogo = await sharp(logoPath)
      .resize({ width: watermarkWidth })
      .ensureAlpha()
      // [R, G, B, A] multipliers, [R, G, B, A] offsets
      // Multiplicamos el alpha por 0.5 y dejamos los colores intactos (x1)
      .linear([1, 1, 1, 0.5], [0, 0, 0, 0])
      .png()
      .toBuffer();

    await fs.writeFile(outputPath, translucentLogo);
    console.log("Done. Check scratch/test-linear.png");
  } catch (err) {
    console.error(err);
  }
}

test();
