import type { jsPDF as JsPDFDoc } from "jspdf";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { CARNET_MARGEN_MM, CARNET_QR_REVERSO_MM } from "@/lib/pdf/carnetLayout";
import { drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";
import {
  BAR_LOGO_MM,
  BAR_REV_FOOTER_MM,
  BAR_REV_HEADER_MM,
  WHITE,
} from "@/lib/pdf/carnet/barSport/carnetBarSportShared";

function shortValidationCode(validationUrl: string | null, playerId: string): string {
  if (validationUrl?.trim()) {
    try {
      const u = new URL(validationUrl);
      const seg = u.pathname.split("/").filter(Boolean).pop();
      if (seg) return seg.toUpperCase();
    } catch {
      /* relativa */
    }
  }
  return playerId.replace(/-/g, "").toUpperCase();
}

function drawLineaPuntos(doc: JsPDFDoc, x: number, y: number, w: number) {
  doc.setDrawColor(120, 128, 140);
  doc.setLineWidth(0.18);
  const step = 1.1;
  for (let px = x; px < x + w; px += step * 2) {
    doc.line(px, y, Math.min(px + step, x + w), y);
  }
  doc.setDrawColor(0);
}

function drawFirmaBar(
  doc: JsPDFDoc,
  x: number,
  y: number,
  w: number,
  firma: string | null,
  nombre: string,
  cargo: string,
) {
  const lineY = y + 7;
  drawLineaPuntos(doc, x, lineY, w);
  if (firma?.startsWith("data:image")) {
    drawLogoFit(doc, firma, x, y, w, 6.5);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.2);
  doc.setTextColor(30, 35, 45);
  doc.text((nombre.trim() || "—").toUpperCase(), x + w / 2, lineY + 2, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.6);
  doc.setTextColor(90, 98, 110);
  doc.text(cargo, x + w / 2, lineY + 4.2, { align: "center" });
  doc.setTextColor(0);
}

export function drawCarnetBarSportReverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = CARNET_MARGEN_MM;
  const primary = input.theme.primaryRgb;
  const code = shortValidationCode(input.validationUrl, input.playerId);
  const qrSize = CARNET_QR_REVERSO_MM - 1;

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, BAR_REV_HEADER_MM, "F");

  const qrX = m;
  const qrY = (BAR_REV_HEADER_MM - qrSize) / 2;
  if (input.validationQrPngDataUrl?.startsWith("data:image")) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 0.4, qrY - 0.4, qrSize + 0.8, qrSize + 0.8, 0.4, 0.4, "F");
    doc.addImage({
      imageData: input.validationQrPngDataUrl,
      format: "PNG",
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
      compression: "NONE",
    });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.2);
  doc.setTextColor(...WHITE);
  const qrHint = doc.splitTextToSize(
    "Escanee el QR para verificar",
    pageW * 0.28,
  );
  doc.text(qrHint, qrX + qrSize + 1.2, qrY + 2);

  const fedLogo = input.theme.showFederation ? input.federacionLogoPngDataUrl : input.ligaLogoPngDataUrl;
  drawLogoFit(
    doc,
    fedLogo,
    pageW / 2 - BAR_LOGO_MM / 2,
    1.2,
    BAR_LOGO_MM,
    BAR_REV_HEADER_MM - 2,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.text("DEPORTISTA", pageW - m, 3.5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.6);
  doc.text("VIGENCIA:", pageW - m, 6.2, { align: "right" });
  const vig = input.vigenciaLabel.trim().slice(0, 36);
  doc.text(vig, pageW - m, 8.5, { align: "right" });
  doc.setTextColor(0);

  const bodyTop = BAR_REV_HEADER_MM;
  const bodyBottom = pageH - BAR_REV_FOOTER_MM;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, bodyTop, pageW, bodyBottom - bodyTop, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.1);
  doc.setTextColor(35, 42, 52);
  const authLines = doc.splitTextToSize(input.authorizationText, pageW - m * 4);
  doc.text(authLines, pageW / 2, bodyTop + 3, { align: "center" });

  const firmasY = bodyTop + 3 + authLines.length * 2.3 + 2.5;
  const gap = 4;
  const firmaW = (pageW - m * 2 - gap) / 2;
  drawFirmaBar(
    doc,
    m,
    firmasY,
    firmaW,
    input.presidentSignaturePngDataUrl,
    input.presidentDisplayName,
    "PRESIDENTE",
  );
  drawFirmaBar(
    doc,
    m + firmaW + gap,
    firmasY,
    firmaW,
    input.secretarySignaturePngDataUrl,
    input.secretaryDisplayName,
    "SECRETARIO",
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.8);
  doc.setTextColor(50, 58, 70);
  doc.text(
    `VIGENCIA HASTA: ${input.vigenciaLabel.trim().toUpperCase()}`,
    pageW / 2,
    bodyBottom - 3.5,
    { align: "center" },
  );

  doc.setFillColor(...primary);
  doc.rect(0, bodyBottom, pageW, BAR_REV_FOOTER_MM, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.2);
  doc.setTextColor(...WHITE);
  doc.text(code, m + 0.5, bodyBottom + 3);
  drawLogoFit(
    doc,
    input.ligaLogoPngDataUrl,
    pageW - m - BAR_LOGO_MM,
    bodyBottom + 0.4,
    BAR_LOGO_MM,
    BAR_REV_FOOTER_MM - 0.8,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.5);
  doc.text("JUGADOR", pageW - m - 1, bodyBottom + 3, { align: "right" });
  doc.setTextColor(0);
}
