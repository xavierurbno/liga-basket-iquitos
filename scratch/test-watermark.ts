import { applyWatermark } from "../src/lib/watermark";
import fs from "fs/promises";
import path from "path";

async function test() {
  const inputPath = path.join(process.cwd(), "public", "logo-liga.png"); // Usamos el mismo logo como fondo para la prueba
  const outputPath = path.join(process.cwd(), "scratch", "test-result.jpg");

  try {
    const inputBuffer = await fs.readFile(inputPath);
    console.log("Aplicando marca de agua...");
    const outputBuffer = await applyWatermark(inputBuffer);
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, outputBuffer);
    console.log(`Resultado guardado en: ${outputPath}`);
  } catch (err) {
    console.error("Error en la prueba:", err);
  }
}

test();
