import type { jsPDF as JsPDFDoc } from "jspdf";
import { LDDBI_TEMPLATE } from "@/lib/carnet/lddbiTemplateLayout";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { CARNET_MARGEN_MM } from "@/lib/pdf/carnetLayout";
import { drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";
import {
  drawLddbiTemplateEncabezadoAnverso,
  drawLddbiTemplateFullBleed,
  drawLddbiTemplateLineaPuntos,
  drawLddbiTemplateReversoFallback,
  LDDBI_TEMPLATE_WHITE_RGB,
} from "@/lib/pdf/carnet/lddbiTemplate/carnetLddbiTemplateShared";

function drawFirmaTemplate(
  doc: JsPDFDoc,
  x: number,
  y: number,
  w: number,
  firma: string | null,
  nombre: string,
  cargo: string,
) {
  const L = LDDBI_TEMPLATE.reverso;
  const lineY = y + 7;
  drawLddbiTemplateLineaPuntos(doc, x, lineY, w);
  if (firma?.startsWith("data:image")) {
    drawLogoFit(doc, firma, x, y, w, 6.5);
  }
  // Nombre del directivo: 9pt bold blanco puro para no perderse bajo la firma.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(L.firmas.nombreFontPt);
  doc.setTextColor(...LDDBI_TEMPLATE_WHITE_RGB);
  doc.text((nombre.trim() || "—").toUpperCase(), x + w / 2, lineY + 3, {
    align: "center",
  });
  // Cargo: 7pt normal, ligeramente atenuado.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(L.firmas.cargoFontPt);
  doc.setTextColor(220, 228, 238);
  doc.text(cargo, x + w / 2, lineY + 3 + L.firmas.gapNombreCargoMm, {
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
  const m = CARNET_MARGEN_MM;
  const L = LDDBI_TEMPLATE.reverso;
  const primary = input.theme.primaryRgb;

  const painted = drawLddbiTemplateFullBleed(
    doc,
    input.reversoTemplatePngDataUrl,
    pageW,
    pageH,
  );
  if (!painted) {
    drawLddbiTemplateReversoFallback(doc, primary);
  }

  drawLddbiTemplateEncabezadoAnverso(doc, input);

  // Párrafo legal: 9.5pt normal, interlineado 1.4 (4.7 mm), centrado.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(L.legal.fontSizePt);
  doc.setTextColor(...LDDBI_TEMPLATE_WHITE_RGB);
  const authLines = doc.splitTextToSize(input.authorizationText, L.legal.maxW);
  const lineH = L.legal.lineHeightMm;
  authLines.forEach((line: string, i: number) => {
    doc.text(line, pageW / 2, L.legal.y + i * lineH, { align: "center" });
  });

  // Firmas: bloque inferior. Ancho 30 mm cada una (no choca con QR derecho).
  const firmasY = L.firmas.y;
  const firmaW = L.firmas.w;
  const gap = L.firmas.gap;
  drawFirmaTemplate(
    doc,
    m,
    firmasY,
    firmaW,
    input.presidentSignaturePngDataUrl,
    input.presidentDisplayName,
    "PRESIDENTE",
  );
  drawFirmaTemplate(
    doc,
    m + firmaW + gap,
    firmasY,
    firmaW,
    input.secretarySignaturePngDataUrl,
    input.secretaryDisplayName,
    "SECRETARIO",
  );

  // Vigencia: pie izquierdo, tamaño original compacto. Alineación left por defecto.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(L.pieVigencia.fontSizePt);
  doc.setTextColor(...LDDBI_TEMPLATE_WHITE_RGB);
  doc.text(
    `VIGENCIA HASTA: ${input.vigenciaLabel.trim().toUpperCase()}`,
    L.pieVigencia.x,
    L.pieVigencia.y,
    { align: "left" },
  );

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
