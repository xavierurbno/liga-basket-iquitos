import type { jsPDF as JsPDFDoc } from "jspdf";
import {
  layoutCarnetFirmaSlots,
  resolveCarnetFirmaSlots,
} from "@/lib/carnet/carnetSignatureMode";
import { LDDBI_TEMPLATE } from "@/lib/carnet/lddbiTemplateLayout";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";
import type { CarnetOverlayColors } from "@/lib/carnet/carnetOverlayColors";
import {
  drawLddbiTemplateEncabezadoAnverso,
  drawLddbiTemplateFullBleed,
  drawLddbiTemplateLineaPuntos,
  drawLddbiTemplateReversoFallback,
  getCarnetOverlayColorsForInput,
} from "@/lib/pdf/carnet/lddbiTemplate/carnetLddbiTemplateShared";

function drawFirmaTemplate(
  doc: JsPDFDoc,
  x: number,
  y: number,
  w: number,
  firma: string | null,
  nombre: string,
  cargo: string,
  overlay: CarnetOverlayColors,
) {
  const L = LDDBI_TEMPLATE.reverso;
  const lineY = y + 7;
  drawLddbiTemplateLineaPuntos(doc, x, lineY, w);
  if (firma?.startsWith("data:image")) {
    drawLogoFit(doc, firma, x, y, w, 6.5);
  }
  const nombreUpper = (nombre.trim() || "—").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(L.firmas.nombreFontPt);
  doc.setTextColor(...overlay.reversoTextRgb);
  const nombreLines = doc.splitTextToSize(nombreUpper, w);
  let nombreY = lineY + 3;
  for (const line of nombreLines) {
    doc.text(line, x + w / 2, nombreY, { align: "center" });
    nombreY += L.firmas.nombreLineHeightMm;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(L.firmas.cargoFontPt);
  doc.setTextColor(...overlay.reversoMutedRgb);
  doc.text(cargo, x + w / 2, nombreY + L.firmas.gapNombreCargoMm, {
    align: "center",
  });
  doc.setTextColor(0);
}

export function drawCarnetLddbiTemplateReverso(
  doc: JsPDFDoc,
  input: CarnetJugadorPdfInput,
): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const L = LDDBI_TEMPLATE.reverso;
  const primary = input.theme.primaryRgb;
  const overlay = getCarnetOverlayColorsForInput(input);

  const painted = drawLddbiTemplateFullBleed(
    doc,
    input.reversoTemplatePngDataUrl,
    pageW,
    pageH,
  );
  if (!painted) {
    drawLddbiTemplateReversoFallback(doc, primary);
  }

  drawLddbiTemplateEncabezadoAnverso(doc, input, "reverso");

  // Párrafo legal: 7pt, interlineado ~3.6 mm, centrado.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(L.legal.fontSizePt);
  doc.setTextColor(...overlay.reversoTextRgb);
  const authLines = doc.splitTextToSize(input.authorizationText, L.legal.maxW);
  const lineH = L.legal.lineHeightMm;
  authLines.forEach((line: string, i: number) => {
    doc.text(line, pageW / 2, L.legal.y + i * lineH, { align: "center" });
  });

  const firmasY = L.firmas.y;
  const firmaLayout = layoutCarnetFirmaSlots(
    input.theme.signatureMode,
    resolveCarnetFirmaSlots(input.theme.signatureMode, {
      presidentDisplayName: input.presidentDisplayName,
      secretaryDisplayName: input.secretaryDisplayName,
      presidentSignaturePngDataUrl: input.presidentSignaturePngDataUrl,
      secretarySignaturePngDataUrl: input.secretarySignaturePngDataUrl,
    }),
  );
  for (const slot of firmaLayout) {
    drawFirmaTemplate(
      doc,
      slot.xMm,
      firmasY,
      slot.wMm,
      slot.firmaPngDataUrl,
      slot.nombre,
      slot.cargo,
      overlay,
    );
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(L.pieVigencia.fontSizePt);
  doc.setTextColor(...overlay.reversoTextRgb);
  const vigenciaText = `VIGENCIA HASTA: ${input.vigenciaLabel.trim().toUpperCase()}`;
  const vigenciaLines = doc.splitTextToSize(vigenciaText, L.pieVigencia.maxW);
  doc.text(vigenciaLines, L.pieVigencia.x, L.pieVigencia.y, { align: "left" });

  const { x: qx, y: qy, size: qs } = L.qr;
  if (input.validationQrPngDataUrl?.startsWith("data:image")) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qx - 0.5, qy - 0.5, qs + 1, qs + 1, 0.4, 0.4, "F");
    doc.addImage({
      imageData: input.validationQrPngDataUrl,
      format: "PNG",
      x: qx,
      y: qy,
      width: qs,
      height: qs,
      compression: "NONE",
    });
  }

  doc.setTextColor(0);
}
