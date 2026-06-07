import { CARNET_ALTO_MM, CARNET_ANCHO_MM } from "@/lib/pdf/carnetLayout";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { createCarnetPdfDocument } from "@/lib/pdf/carnet/carnetPdfShared";
import { drawCarnetLddbiTemplateAnverso } from "@/lib/pdf/carnet/lddbiTemplate/carnetLddbiTemplateAnverso";
import { drawCarnetLddbiTemplateReverso } from "@/lib/pdf/carnet/lddbiTemplate/carnetLddbiTemplateReverso";

export type { CarnetJugadorPdfInput } from "@/lib/types/carnet";

/**
 * Genera el carnet CR80 horizontal a doble cara (anverso + reverso).
 * Todas las imágenes deben llegar como data URLs escaladas (ver `buildCarnetPdfImageAssets`).
 */
export function generarCarnetJugadorPdf(input: CarnetJugadorPdfInput): Blob {
  const doc = createCarnetPdfDocument();

  drawCarnetLddbiTemplateAnverso(doc, input);
  doc.addPage([CARNET_ANCHO_MM, CARNET_ALTO_MM]);
  drawCarnetLddbiTemplateReverso(doc, input);

  return doc.output("blob");
}
