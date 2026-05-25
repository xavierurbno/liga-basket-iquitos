import type { jsPDF as JsPDFDoc } from "jspdf";
import { splitFederationDisplayLines } from "@/lib/carnet/carnetTheme";
import { resolveLddbiReversoLineas } from "@/lib/carnet/lddbiEncabezadoText";
import { LDDBI_FONT_REV, LDDBI_QR_REVERSO_MM } from "@/lib/carnet/lddbiPremiumTheme";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { CARNET_MARGEN_MM } from "@/lib/pdf/carnetLayout";
import { drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";
import { WHITE } from "@/lib/pdf/carnet/carnetPdfShared";
import {
  drawLddbiZoneWatermark,
  LDDBI_LOGO_MM,
  LDDBI_REV_BOTTOM_BAR_MM,
  LDDBI_REV_QR_ZONE_MM,
  LDDBI_REV_TOP_MM,
} from "@/lib/pdf/carnet/lddbi/carnetLddbiShared";

function shortValidationCode(validationUrl: string | null, playerId: string): string {
  if (validationUrl?.trim()) {
    try {
      const u = new URL(validationUrl);
      const seg = u.pathname.split("/").filter(Boolean).pop();
      if (seg) return seg.slice(0, 20).toUpperCase();
    } catch {
      /* relativa */
    }
  }
  return playerId.replace(/-/g, "").slice(0, 20).toUpperCase();
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

function drawFirmaLddbi(
  doc: JsPDFDoc,
  x: number,
  y: number,
  w: number,
  firma: string | null,
  nombre: string,
  cargo: string,
) {
  const lineY = y + 8;
  drawLineaPuntos(doc, x, lineY, w);
  if (firma?.startsWith("data:image")) {
    drawLogoFit(doc, firma, x, y, w, 7.5);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT_REV.firmaNombre);
  doc.setTextColor(30, 35, 45);
  doc.text((nombre.trim() || "—").toUpperCase(), x + w / 2, lineY + 2.4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT_REV.firmaCargo);
  doc.setTextColor(90, 98, 110);
  doc.text(cargo, x + w / 2, lineY + 4.8, { align: "center" });
  doc.setTextColor(0);
}

export function drawCarnetLddbiReverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const primary = input.theme.primaryRgb;
  const m = CARNET_MARGEN_MM;
  const code = shortValidationCode(input.validationUrl, input.playerId);
  const fedPieLines = splitFederationDisplayLines(
    input.theme.federationDisplayName,
    input.theme.showFederation,
  );
  const watermarkPng =
    input.sportGraphicPngDataUrl ?? input.federacionLogoPngDataUrl ?? input.ligaLogoPngDataUrl;

  const { lineaFederacion, lineaLiga } = resolveLddbiReversoLineas(input.leagueDisplayName);
  const revLogoSlot = LDDBI_LOGO_MM - 0.5;
  const vigenciaW = 18;

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, LDDBI_REV_TOP_MM, "F");
  drawLogoFit(doc, input.ligaLogoPngDataUrl, m, 0.6, revLogoSlot, LDDBI_REV_TOP_MM - 1.2);

  const centerMaxW = pageW - m * 2 - revLogoSlot - vigenciaW - 2;
  const fedLineH = 2.35;
  const ligaLineH = 2.1;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT_REV.reversoFed);
  const reversoFedLines = doc.splitTextToSize(lineaFederacion, centerMaxW);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT_REV.reversoLiga);
  const reversoLigaLines = doc.splitTextToSize(lineaLiga, centerMaxW);

  const textBlockH = reversoFedLines.length * fedLineH + reversoLigaLines.length * ligaLineH;
  let textY = (LDDBI_REV_TOP_MM - textBlockH) / 2 + 1.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT_REV.reversoFed);
  doc.setTextColor(255, 255, 255);
  for (const line of reversoFedLines) {
    doc.text(line, pageW / 2, textY, { align: "center" });
    textY += fedLineH;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT_REV.reversoLiga);
  doc.setTextColor(248, 252, 255);
  for (const line of reversoLigaLines) {
    doc.text(line, pageW / 2, textY, { align: "center" });
    textY += ligaLineH;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT_REV.vigenciaTitulo);
  doc.setTextColor(...WHITE);
  doc.text("VIGENCIA", pageW - m, LDDBI_REV_TOP_MM / 2 + 0.5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT_REV.vigenciaValor);
  const vigShort = input.vigenciaLabel.trim().slice(0, 42);
  doc.text(vigShort, pageW - m, LDDBI_REV_TOP_MM / 2 + 3.2, { align: "right" });

  const qrZoneTop = LDDBI_REV_TOP_MM;
  const qrZoneH = LDDBI_REV_QR_ZONE_MM;
  const lightBlue: [number, number, number] = [
    Math.round(primary[0] * 0.15 + 220 * 0.85),
    Math.round(primary[1] * 0.15 + 235 * 0.85),
    Math.round(primary[2] * 0.15 + 248 * 0.85),
  ];
  doc.setFillColor(...lightBlue);
  doc.rect(0, qrZoneTop, pageW, qrZoneH, "F");

  drawLddbiZoneWatermark(doc, watermarkPng, pageW * 0.18, qrZoneTop + 0.5, pageW * 0.64, qrZoneH - 1);

  const qrSize = LDDBI_QR_REVERSO_MM;
  const qrX = (pageW - qrSize) / 2;
  const qrY = qrZoneTop + (qrZoneH - qrSize) / 2;
  if (input.validationQrPngDataUrl?.startsWith("data:image")) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 0.8, qrY - 0.8, qrSize + 1.6, qrSize + 1.6, 0.6, 0.6, "F");
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

  const whiteTop = qrZoneTop + qrZoneH;
  const whiteBottom = pageH - LDDBI_REV_BOTTOM_BAR_MM;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, whiteTop, pageW, whiteBottom - whiteTop, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT_REV.legal);
  doc.setTextColor(35, 42, 52);
  const authLines = doc.splitTextToSize(input.authorizationText, pageW - m * 3.5);
  doc.text(authLines, pageW / 2, whiteTop + 3.5, { align: "center" });

  const firmasY = whiteTop + 3.5 + authLines.length * 2.6 + 2.5;
  const gap = 4;
  const firmaW = (pageW - m * 2 - gap) / 2;
  drawFirmaLddbi(
    doc,
    m,
    firmasY,
    firmaW,
    input.presidentSignaturePngDataUrl,
    input.presidentDisplayName,
    "PRESIDENTE",
  );
  drawFirmaLddbi(
    doc,
    m + firmaW + gap,
    firmasY,
    firmaW,
    input.secretarySignaturePngDataUrl,
    input.secretaryDisplayName,
    "SECRETARIO",
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT_REV.vigenciaHasta);
  doc.setTextColor(50, 58, 70);
  doc.text(
    `VIGENCIA HASTA: ${input.vigenciaLabel.trim().toUpperCase()}`,
    pageW / 2,
    whiteBottom - 4.5,
    { align: "center" },
  );

  doc.setFillColor(...primary);
  doc.rect(0, whiteBottom, pageW, LDDBI_REV_BOTTOM_BAR_MM, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT_REV.pieCodigo);
  doc.setTextColor(...WHITE);
  doc.text(code, m + 0.5, whiteBottom + 3.5);

  const pieLogoW = LDDBI_LOGO_MM;
  drawLogoFit(
    doc,
    input.ligaLogoPngDataUrl,
    pageW / 2 - pieLogoW / 2,
    whiteBottom + 0.6,
    pieLogoW,
    LDDBI_REV_BOTTOM_BAR_MM - 1.2,
  );

  if (fedPieLines) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(LDDBI_FONT_REV.pieFed);
    const fedY = whiteBottom + 2.2;
    doc.text(fedPieLines[0].toUpperCase(), pageW - m, fedY, { align: "right" });
    if (fedPieLines[1]?.trim()) {
      doc.text(fedPieLines[1].toUpperCase(), pageW - m, fedY + 2, { align: "right" });
    }
  }

  doc.setTextColor(0);
}
