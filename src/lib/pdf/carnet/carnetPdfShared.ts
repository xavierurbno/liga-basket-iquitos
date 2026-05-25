import { jsPDF, type jsPDF as JsPDFDoc } from "jspdf";
import type { CarnetPremiumPalette } from "@/lib/carnet/carnetPremiumTheme";
import { resolveCarnetPremiumPalette } from "@/lib/carnet/carnetPremiumTheme";
import { resolveFichaLeagueTitle } from "@/lib/pdf/fichaInstitucionalTextos";
import {
  CARNET_ACCENT_BAND_MM,
  CARNET_ALTO_MM,
  CARNET_ANCHO_MM,
  CARNET_FOTO_ALTO_MM,
  CARNET_FOTO_ANCHO_MM,
  CARNET_HEADER_ALTO_MM,
  CARNET_HEADER_LOGO_MM,
  CARNET_MARGEN_MM,
  CARNET_PANEL_RGB,
} from "@/lib/pdf/carnetLayout";
import { drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";

const WHITE: [number, number, number] = [255, 255, 255];

export function fmtFechaCarnetPeru(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function createCarnetPdfDocument(): jsPDF {
  return new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [CARNET_ANCHO_MM, CARNET_ALTO_MM],
    compress: false,
  });
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Degradado suave vertical (impresión-friendly, bandas finas). */
export function drawCarnetPremiumFondo(
  doc: JsPDFDoc,
  palette: CarnetPremiumPalette,
  accentBandMm = 0,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const fillH = pageH - accentBandMm;
  const steps = 14;

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const c = lerpRgb(palette.topRgb, palette.bottomRgb, t);
    const y = (fillH / steps) * i;
    const h = fillH / steps + 0.15;
    doc.setFillColor(...c);
    doc.rect(0, y, pageW, h, "F");
  }

  doc.setDrawColor(210, 214, 220);
  doc.setLineWidth(0.2);
  doc.rect(0.5, 0.5, pageW - 1, pageH - 1, "S");
  doc.setDrawColor(0);
}

export function drawCarnetFranjaAcento(
  doc: JsPDFDoc,
  palette: CarnetPremiumPalette,
  lineaIzq: string,
  lineaDer?: string,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const y = pageH - CARNET_ACCENT_BAND_MM;

  doc.setFillColor(...palette.accentRgb);
  doc.rect(0, y, pageW, CARNET_ACCENT_BAND_MM, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.6);
  doc.setTextColor(...WHITE);
  doc.text(lineaIzq.toUpperCase(), CARNET_MARGEN_MM + 0.5, y + 2.7);
  if (lineaDer?.trim()) {
    doc.text(lineaDer.toUpperCase(), pageW - CARNET_MARGEN_MM - 0.5, y + 2.7, {
      align: "right",
    });
  }
  doc.setTextColor(0);
}

/** Cabecera premium: logos contenidos + nombre de liga protagonista. */
export function drawCarnetEncabezadoPremium(
  doc: JsPDFDoc,
  leagueDisplayName: string,
  ligaLogoPngDataUrl: string | null,
  federacionLogoPngDataUrl: string | null,
  palette: CarnetPremiumPalette,
  subtitulo?: string,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const slot = CARNET_HEADER_LOGO_MM;
  const headerH = CARNET_HEADER_ALTO_MM;
  const logoY = 1.1;

  drawLogoFit(doc, ligaLogoPngDataUrl, CARNET_MARGEN_MM, logoY, slot, headerH - 1.6);
  drawLogoFit(
    doc,
    federacionLogoPngDataUrl,
    pageW - CARNET_MARGEN_MM - slot,
    logoY,
    slot,
    headerH - 1.6,
  );

  const centerMaxW = pageW - 2 * (CARNET_MARGEN_MM + slot + 2.5);
  const titulo = resolveFichaLeagueTitle(leagueDisplayName);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...palette.inkRgb);
  const lineas = doc.splitTextToSize(titulo, centerMaxW);
  const lineH = 2.55;
  let textY = headerH / 2 - (lineas.length * lineH) / 2 + (subtitulo ? 0.4 : 0.8);
  for (const line of lineas) {
    doc.text(line, pageW / 2, textY, { align: "center" });
    textY += lineH;
  }

  if (subtitulo?.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.2);
    doc.setTextColor(...palette.mutedRgb);
    doc.text(subtitulo.toUpperCase(), pageW / 2, headerH - 1.1, { align: "center" });
  }

  doc.setDrawColor(200, 206, 214);
  doc.setLineWidth(0.18);
  doc.line(CARNET_MARGEN_MM, headerH, pageW - CARNET_MARGEN_MM, headerH);
  doc.setDrawColor(0);
  doc.setTextColor(0);
}

export function resolvePaletteForCarnetInput(
  primaryRgb: [number, number, number],
  accentRgb: [number, number, number],
  variant: "anverso" | "reverso",
): CarnetPremiumPalette {
  return resolveCarnetPremiumPalette(primaryRgb, accentRgb, variant);
}

export function drawFotoJugadorCarnet(
  doc: JsPDFDoc,
  fotoPngDataUrl: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: CarnetPremiumPalette,
) {
  doc.setFillColor(...CARNET_PANEL_RGB);
  doc.setDrawColor(palette.mutedRgb[0], palette.mutedRgb[1], palette.mutedRgb[2]);
  doc.setLineWidth(0.22);
  doc.roundedRect(x, y, w, h, 0.8, 0.8, "FD");

  if (fotoPngDataUrl?.startsWith("data:image")) {
    const pad = 0.35;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    const s = Math.min(innerW / CARNET_FOTO_ANCHO_MM, innerH / CARNET_FOTO_ALTO_MM, 1);
    const iw = CARNET_FOTO_ANCHO_MM * s;
    const ih = CARNET_FOTO_ALTO_MM * s;
    const ox = x + (w - iw) / 2;
    const oy = y + (h - ih) / 2;
    let fmt: "PNG" | "JPEG" = "PNG";
    if (
      fotoPngDataUrl.startsWith("data:image/jpeg") ||
      fotoPngDataUrl.startsWith("data:image/jpg")
    ) {
      fmt = "JPEG";
    }
    doc.addImage({
      imageData: fotoPngDataUrl,
      format: fmt,
      x: ox,
      y: oy,
      width: iw,
      height: ih,
      compression: "NONE",
    });
    return;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.2);
  doc.setTextColor(...palette.mutedRgb);
  doc.text("SIN FOTO", x + w / 2, y + h / 2, { align: "center", baseline: "middle" });
  doc.setTextColor(0);
}

/** Campo limpio: etiqueta muted + valor en negrita. */
export function drawCampoCarnetPremium(
  doc: JsPDFDoc,
  etiqueta: string,
  valor: string,
  x: number,
  y: number,
  maxW: number,
  palette: CarnetPremiumPalette,
): void {
  const label = `${etiqueta} :`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.4);
  doc.setTextColor(...palette.mutedRgb);
  doc.text(label, x, y);

  const labelW = doc.getTextWidth(label) + 1.2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...palette.inkRgb);
  const valLines = doc.splitTextToSize(valor, maxW - labelW);
  doc.text(valLines, x + labelW, y);
}

export { WHITE };
