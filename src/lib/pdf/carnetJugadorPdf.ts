import { CARNET_ALTO_MM, CARNET_ANCHO_MM } from "@/lib/pdf/carnetLayout";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { drawCarnetAnverso } from "@/lib/pdf/carnet/carnetAnverso";
import { createCarnetPdfDocument } from "@/lib/pdf/carnet/carnetPdfShared";
import { drawCarnetBarSportAnverso } from "@/lib/pdf/carnet/barSport/carnetBarSportAnverso";
import { drawCarnetBarSportReverso } from "@/lib/pdf/carnet/barSport/carnetBarSportReverso";
import { drawCarnetLddbiAnverso } from "@/lib/pdf/carnet/lddbi/carnetLddbiAnverso";
import { drawCarnetLddbiReverso } from "@/lib/pdf/carnet/lddbi/carnetLddbiReverso";
import { drawCarnetLddbiTemplateAnverso } from "@/lib/pdf/carnet/lddbiTemplate/carnetLddbiTemplateAnverso";
import { drawCarnetLddbiTemplateReverso } from "@/lib/pdf/carnet/lddbiTemplate/carnetLddbiTemplateReverso";
import { drawCarnetReverso } from "@/lib/pdf/carnet/carnetReverso";

export type { CarnetJugadorPdfInput } from "@/lib/types/carnet";

/**
 * Genera el carnet CR80 horizontal a doble cara (anverso + reverso).
 * Todas las imágenes deben llegar como data URLs escaladas (ver `buildCarnetPdfImageAssets`).
 */
export function generarCarnetJugadorPdf(input: CarnetJugadorPdfInput): Blob {
  const doc = createCarnetPdfDocument();
  const preset = input.theme?.preset ?? "institutional_soft";

  if (preset === "lddbi_bold") {
    drawCarnetLddbiAnverso(doc, input);
    doc.addPage([CARNET_ANCHO_MM, CARNET_ALTO_MM]);
    drawCarnetLddbiReverso(doc, input);
  } else if (preset === "lddbi_template") {
    drawCarnetLddbiTemplateAnverso(doc, input);
    doc.addPage([CARNET_ANCHO_MM, CARNET_ALTO_MM]);
    drawCarnetLddbiTemplateReverso(doc, input);
  } else if (preset === "federation_bar_sport") {
    drawCarnetBarSportAnverso(doc, input);
    doc.addPage([CARNET_ANCHO_MM, CARNET_ALTO_MM]);
    drawCarnetBarSportReverso(doc, input);
  } else {
    drawCarnetAnverso(doc, input);
    doc.addPage([CARNET_ANCHO_MM, CARNET_ALTO_MM]);
    drawCarnetReverso(doc, input);
  }

  return doc.output("blob");
}
