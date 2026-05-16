import { FOTO_CELDA_ALTO_MM, FOTO_CELDA_ANCHO_MM } from "@/lib/pdf/fichaLayout";

const DPI_IMPRESION = 300;

/** Píxeles necesarios para una dimensión en mm a la densidad indicada (p. ej. 300 DPI). */
export function mmAPixeles300Dpi(mm: number, dpi = DPI_IMPRESION): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Escala la imagen a la resolución de impresión ~300 DPI para el slot de foto (20×25 mm),
 * recorte type "cover" centrado para máxima nitidez al rasterizar en el PDF.
 */
/** Supermuestreo respecto a 300 DPI para que el PNG incrustado sea muy denso; jsPDF escala a mm en la celda. */
const FOTO_POLO_SRC_SCALE = 2;

export function escalarFotoPoloParaImpresion300Dpi(dataUrl: string): Promise<string> {
  const tw = mmAPixeles300Dpi(FOTO_CELDA_ANCHO_MM) * FOTO_POLO_SRC_SCALE;
  const th = mmAPixeles300Dpi(FOTO_CELDA_ALTO_MM) * FOTO_POLO_SRC_SCALE;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const targetRatio = tw / th;
      const imgRatio = img.width / img.height;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Logos / staff: mantiene nitidez sin inflar demasiado el PDF (mínimo equivalente ~300 DPI en el tamaño dibujado). */
export function escalarLogoParaPdf(dataUrl: string, maxLadoPx = 900): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w <= maxLadoPx && h <= maxLadoPx) {
        resolve(dataUrl);
        return;
      }
      const s = maxLadoPx / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d");
      if (!x) {
        resolve(dataUrl);
        return;
      }
      x.imageSmoothingEnabled = true;
      x.imageSmoothingQuality = "high";
      x.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
