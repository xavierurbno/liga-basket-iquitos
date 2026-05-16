"use server";

import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

/**
 * Carga los logos institucionales desde el sistema de archivos del servidor
 * y los procesa con Sharp para asegurar que sean compatibles con jsPDF.
 */
export async function getInstitutionalLogosAction() {
  try {
    const logosDir = path.resolve(process.cwd(), "public", "logos");
    
    // Rutas absolutas seguras
    const fedPath = path.join(logosDir, "federacion.png");
    const ligaPath = path.join(logosDir, "liga.png");

    const [fedBuffer, ligaBuffer] = await Promise.all([
      fs.readFile(fedPath),
      fs.readFile(ligaPath),
    ]);

    // Procesamiento con Sharp: Redimensionar para optimizar PDF (ancho estándar 200px)
    const [fedProcessed, ligaProcessed] = await Promise.all([
      sharp(fedBuffer)
        .resize(200)
        .png()
        .toBuffer(),
      sharp(ligaBuffer)
        .resize(300) // Logo de la liga un poco más grande para marca de agua
        .png()
        .toBuffer(),
    ]);

    return {
      success: true,
      federacionBase64: `data:image/png;base64,${fedProcessed.toString("base64")}`,
      ligaBase64: `data:image/png;base64,${ligaProcessed.toString("base64")}`,
    };
  } catch (error) {
    console.error("Error cargando logos institucionales:", error);
    return {
      success: false,
      error: "No se pudieron cargar los logos institucionales.",
    };
  }
}
