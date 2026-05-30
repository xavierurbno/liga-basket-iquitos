import type { jsPDF as JsPDFDoc } from "jspdf";
import { splitFederationDisplayLines } from "@/lib/carnet/carnetTheme";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import {
  CARNET_ACCENT_BAND_MM,
  CARNET_HEADER_ALTO_MM,
  CARNET_MARGEN_MM,
  CARNET_QR_REVERSO_MM,
  CARNET_REVERSO_FIRMAS_ALTO_MM,
} from "@/lib/pdf/carnetLayout";
import {
  drawCarnetEncabezadoPremium,
  drawCarnetFranjaAcento,
  drawCarnetPremiumFondo,
  resolvePaletteForCarnetInput,
} from "@/lib/pdf/carnet/carnetPdfShared";
import { drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";

function shortValidationCode(validationUrl: string | null, playerId: string): string {
  if (validationUrl?.trim()) {
    try {
      const u = new URL(validationUrl);
      const seg = u.pathname.split("/").filter(Boolean).pop();
      if (seg) return seg.slice(0, 12).toUpperCase();
    } catch {
      /* URL relativa */
    }
  }
  return playerId.replace(/-/g, "").slice(0, 12).toUpperCase();
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

function drawBloqueFirmaPremium(
  doc: JsPDFDoc,
  x: number,
  y: number,
  w: number,
  firmaPng: string | null,
  nombre: string,
  cargo: string,
  ink: [number, number, number],
  muted: [number, number, number],
) {
  const lineY = y + 8.2;
  drawLineaPuntos(doc, x, lineY, w);

  if (firmaPng?.startsWith("data:image")) {
    drawLogoFit(doc, firmaPng, x, y, w, 7.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.6);
  doc.setTextColor(...ink);
  const nombreLines = doc.splitTextToSize(nombre.trim().toUpperCase() || "—", w);
  doc.text(nombreLines, x + w / 2, lineY + 2.4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(...muted);
  doc.text(cargo, x + w / 2, lineY + 2.4 + nombreLines.length * 2.2 + 0.8, {
    align: "center",
  });
  doc.setTextColor(0);
}

export function drawCarnetReverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const palette = resolvePaletteForCarnetInput(input.primaryRgb, input.accentRgb, "reverso");

  drawCarnetPremiumFondo(doc, palette, CARNET_ACCENT_BAND_MM);
  const fedSubtitle = input.theme.showFederation
    ? input.theme.federationDisplayName?.trim().slice(0, 48) ||
      "F.D.P.B. · Validación oficial"
    : "Validación oficial";

  drawCarnetEncabezadoPremium(
    doc,
    input.leagueDisplayName,
    input.ligaLogoPngDataUrl,
    input.theme.showFederation ? input.federacionLogoPngDataUrl : null,
    palette,
    fedSubtitle,
  );

  const margin = CARNET_MARGEN_MM;
  const contentTop = CARNET_HEADER_ALTO_MM + 2.8;
  const firmasTop = pageH - CARNET_MARGEN_MM - CARNET_ACCENT_BAND_MM - CARNET_REVERSO_FIRMAS_ALTO_MM;
  const textMaxW = pageW - margin * 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.85);
  doc.setTextColor(...palette.inkRgb);
  const authLines = doc.splitTextToSize(input.authorizationText, textMaxW);
  const authLineH = 2.5;
  const authBlockH = authLines.length * authLineH;
  const authY = contentTop + 1.5;
  doc.text(authLines, pageW / 2, authY, { align: "center" });

  const qrSize = CARNET_QR_REVERSO_MM;
  const qrBlockTop = authY + authBlockH + 3.5;
  const qrBlockBottom = firmasTop - 2.5;
  const qrBlockH = qrBlockBottom - qrBlockTop;
  const qrY = qrBlockTop + (qrBlockH - qrSize) / 2;
  const qrX = margin + 2;

  if (input.validationQrPngDataUrl?.startsWith("data:image")) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 224, 230);
    doc.setLineWidth(0.15);
    const pad = 0.5;
    doc.roundedRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 0.6, 0.6, "FD");
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

  const metaX = qrX + qrSize + 3.5;
  const code = shortValidationCode(input.validationUrl, input.playerId);
  let metaY = qrY + 2.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.2);
  doc.setTextColor(...palette.inkRgb);
  doc.text("VALIDACIÓN", metaX, metaY);
  metaY += 3.2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.4);
  doc.setTextColor(...palette.mutedRgb);
  doc.text("Escanee el código QR", metaX, metaY);
  metaY += 2.6;
  doc.text("en mesa de control", metaX, metaY);
  metaY += 3.4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.8);
  doc.setTextColor(...palette.accentRgb);
  doc.text(`ID ${code}`, metaX, metaY);
  metaY += 3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(...palette.mutedRgb);
  const fedLines = splitFederationDisplayLines(
    input.theme.federationDisplayName,
    input.theme.showFederation,
  );
  if (fedLines) {
    doc.text(fedLines[0], metaX, metaY);
    if (fedLines[1]) doc.text(fedLines[1], metaX, metaY + 2.3);
  }

  const gap = 4;
  const firmaW = (pageW - margin * 2 - gap) / 2;
  drawBloqueFirmaPremium(
    doc,
    margin,
    firmasTop,
    firmaW,
    input.presidentSignaturePngDataUrl,
    input.presidentDisplayName,
    "PRESIDENTE",
    palette.inkRgb,
    palette.mutedRgb,
  );
  drawBloqueFirmaPremium(
    doc,
    margin + firmaW + gap,
    firmasTop,
    firmaW,
    input.secretarySignaturePngDataUrl,
    input.secretaryDisplayName,
    "SECRETARIO",
    palette.inkRgb,
    palette.mutedRgb,
  );

  drawCarnetFranjaAcento(
    doc,
    palette,
    `VIGENCIA: ${input.vigenciaLabel.trim()}`,
    "DOCUMENTO OFICIAL",
  );

  doc.setTextColor(0);
}
