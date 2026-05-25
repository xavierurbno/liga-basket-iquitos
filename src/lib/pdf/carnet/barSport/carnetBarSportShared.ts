import type { jsPDF as JsPDFDoc } from "jspdf";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { resolveFichaLeagueTitle } from "@/lib/pdf/fichaInstitucionalTextos";
import { CARNET_MARGEN_MM, CARNET_PANEL_RGB } from "@/lib/pdf/carnetLayout";
import { drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";
import { WHITE } from "@/lib/pdf/carnet/carnetPdfShared";

export const BAR_HEADER_MM = 9;
export const BAR_FOOTER_MM = 5;
export const BAR_REV_HEADER_MM = 13;
export const BAR_REV_FOOTER_MM = 5;
export const BAR_LOGO_MM = 6.5;

const INK: [number, number, number] = [28, 32, 40];
const MUTED: [number, number, number] = [90, 98, 110];

export function drawBarSportHeaderAnverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput) {
  const pageW = doc.internal.pageSize.getWidth();
  const primary = input.theme.primaryRgb;
  const m = CARNET_MARGEN_MM;

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, BAR_HEADER_MM, "F");

  const fedLogo = input.theme.showFederation ? input.federacionLogoPngDataUrl : null;
  drawLogoFit(doc, fedLogo, m, 1, BAR_LOGO_MM, BAR_HEADER_MM - 1.5);

  const sportLabel = (input.theme.sportLabel || "BÁSQUET").toUpperCase();
  const fedName =
    input.theme.showFederation && input.theme.federationDisplayName?.trim()
      ? input.theme.federationDisplayName.trim().toUpperCase()
      : resolveFichaLeagueTitle(input.leagueDisplayName);

  const centerX = pageW / 2;
  const centerMaxW = pageW - 2 * (m + BAR_LOGO_MM + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.2);
  doc.setTextColor(...WHITE);
  const fedLines = doc.splitTextToSize(fedName, centerMaxW);
  let y = BAR_HEADER_MM / 2 - (fedLines.length * 2.2) / 2 + 0.5;
  for (const line of fedLines) {
    doc.text(line, centerX, y, { align: "center" });
    y += 2.2;
  }

  doc.setFontSize(5.5);
  doc.text(sportLabel, pageW - m, BAR_HEADER_MM / 2 + 0.5, { align: "right" });
  doc.setTextColor(0);
}

export function drawBarSportFooterAnverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const y = pageH - BAR_FOOTER_MM;

  doc.setFillColor(...input.theme.primaryRgb);
  doc.rect(0, y, pageW, BAR_FOOTER_MM, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(...WHITE);
  const titulo = resolveFichaLeagueTitle(input.leagueDisplayName);
  doc.text(titulo, pageW / 2, y + 3.2, { align: "center", maxWidth: pageW - 4 });
  doc.setTextColor(0);
}

export function drawBarSportFoto(
  doc: JsPDFDoc,
  fotoPng: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
  borderRgb: [number, number, number],
) {
  const b = 0.7;
  doc.setFillColor(...borderRgb);
  doc.roundedRect(x - b, y - b, w + b * 2, h + b * 2, 1, 1, "F");
  doc.setFillColor(...CARNET_PANEL_RGB);
  doc.roundedRect(x, y, w, h, 0.8, 0.8, "F");

  if (fotoPng?.startsWith("data:image")) {
    let fmt: "PNG" | "JPEG" = "PNG";
    if (fotoPng.startsWith("data:image/jpeg") || fotoPng.startsWith("data:image/jpg")) {
      fmt = "JPEG";
    }
    doc.addImage({
      imageData: fotoPng,
      format: fmt,
      x: x + 0.25,
      y: y + 0.25,
      width: w - 0.5,
      height: h - 0.5,
      compression: "NONE",
    });
    return;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.8);
  doc.setTextColor(...MUTED);
  doc.text("SIN FOTO", x + w / 2, y + h / 2, { align: "center", baseline: "middle" });
  doc.setTextColor(0);
}

export function drawBarSportCampo(
  doc: JsPDFDoc,
  etiqueta: string,
  valor: string,
  x: number,
  y: number,
  maxW: number,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.6);
  doc.setTextColor(...MUTED);
  doc.text(`${etiqueta}:`, x, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.4);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(valor, maxW);
  doc.text(lines, x, y + 2.4);
  doc.setTextColor(0);
}

export function drawBarSportGraphicCenter(
  doc: JsPDFDoc,
  graphicPng: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (graphicPng?.startsWith("data:image")) {
    drawLogoFit(doc, graphicPng, x, y, w, h);
    return;
  }
  doc.setFillColor(245, 247, 250);
  doc.rect(x, y, w, h, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(210, 218, 228);
  const label = "BÁSQUET";
  doc.text(label, x + w / 2, y + h / 2, { align: "center", baseline: "middle" });
  doc.setTextColor(0);
}

export { INK, MUTED, WHITE };
