import type { jsPDF as JsPDFDoc } from "jspdf";
import { formatGeneroCarnetEtiqueta } from "@/lib/carnet/carnetInstitucionalText";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { CARNET_MARGEN_MM } from "@/lib/pdf/carnetLayout";
import { fmtFechaCarnetPeru } from "@/lib/pdf/carnet/carnetPdfShared";
import {
  BAR_FOOTER_MM,
  BAR_HEADER_MM,
  drawBarSportCampo,
  drawBarSportFoto,
  drawBarSportFooterAnverso,
  drawBarSportGraphicCenter,
  drawBarSportHeaderAnverso,
  INK,
} from "@/lib/pdf/carnet/barSport/carnetBarSportShared";

export function drawCarnetBarSportAnverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = CARNET_MARGEN_MM;
  const bodyTop = BAR_HEADER_MM;
  const bodyBottom = pageH - BAR_FOOTER_MM;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, bodyTop, pageW, bodyBottom - bodyTop, "F");

  drawBarSportHeaderAnverso(doc, input);

  const contentTop = bodyTop + 2;
  const contentH = bodyBottom - contentTop - 1;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(...INK);
  doc.text("DATOS DEL DEPORTISTA", m + 0.5, contentTop + 2.5);

  const fotoW = 18;
  const fotoH = 22;
  const fotoX = pageW - m - fotoW;
  const fotoY = contentTop + (contentH - fotoH) / 2;

  const graphicW = pageW * 0.22;
  const graphicX = fotoX - graphicW - 2;
  const graphicY = contentTop + 4;
  const graphicH = contentH - 6;

  drawBarSportGraphicCenter(
    doc,
    input.sportGraphicPngDataUrl,
    graphicX,
    graphicY,
    graphicW,
    graphicH,
  );

  const datosX = m + 0.5;
  const datosW = graphicX - datosX - 1.5;
  const campos: [string, string][] = [
    ["APELLIDOS", `${input.apellidoPaterno} ${input.apellidoMaterno}`.trim()],
    ["NOMBRES", input.name.trim().toUpperCase()],
    ["DNI", input.documentNumber.trim()],
    ["CLUB", input.clubName.trim().toUpperCase()],
    ["CATEGORÍA", input.categoriaNombre.trim().toUpperCase()],
    ["GÉNERO", formatGeneroCarnetEtiqueta(input.gender)],
  ];

  const step = 5.8;
  const blockH = campos.length * step;
  let y = contentTop + (contentH - blockH) / 2 + 2;

  campos.forEach(([etq, val]) => {
    drawBarSportCampo(doc, etq, val, datosX, y, datosW);
    y += step;
  });

  drawBarSportFoto(
    doc,
    input.fotoPngDataUrl,
    fotoX,
    fotoY,
    fotoW,
    fotoH,
    input.theme.primaryRgb,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(90, 98, 110);
  doc.text("F. NAC.", fotoX, fotoY + fotoH + 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.6);
  doc.setTextColor(...INK);
  doc.text(fmtFechaCarnetPeru(input.fechaNacimientoIso), fotoX + 10, fotoY + fotoH + 2);

  if (input.carnetNumber?.trim()) {
    doc.setFontSize(4);
    doc.setTextColor(...input.theme.primaryRgb);
    doc.text(
      `N° ${input.carnetNumber.trim()}`,
      fotoX + fotoW / 2,
      fotoY + fotoH + 5,
      { align: "center" },
    );
  }

  drawBarSportFooterAnverso(doc, input);
  doc.setTextColor(0);
}
