import type { jsPDF as JsPDFDoc } from "jspdf";
import { resolveLddbiEncabezadoLineas } from "@/lib/carnet/lddbiEncabezadoText";
import {
  LDDBI_ACCENT_BAND_MM,
  LDDBI_FED_LOGO_MM,
  LDDBI_FONT,
  LDDBI_HEADER_LOGO_MM,
  LDDBI_HEADER_MM,
  LDDBI_LEAGUE_LOGO_MM,
  LDDBI_LOGO_MM,
  LDDBI_REV_BOTTOM_BAR_MM,
  LDDBI_REV_QR_ZONE_MM,
  LDDBI_REV_TOP_MM,
} from "@/lib/carnet/lddbiPremiumTheme";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import {
  CARNET_ALTO_MM,
  CARNET_ANCHO_MM,
  CARNET_MARGEN_MM,
  CARNET_PANEL_RGB,
} from "@/lib/pdf/carnetLayout";
import { drawLogoCover, drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";
import { WHITE } from "@/lib/pdf/carnet/carnetPdfShared";

export {
  LDDBI_ACCENT_BAND_MM,
  LDDBI_FED_LOGO_MM,
  LDDBI_HEADER_LOGO_MM,
  LDDBI_HEADER_MM,
  LDDBI_LEAGUE_LOGO_MM,
  LDDBI_LOGO_MM,
  LDDBI_REV_BOTTOM_BAR_MM,
  LDDBI_REV_QR_ZONE_MM,
  LDDBI_REV_TOP_MM,
};

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

/** Degradado diagonal (esquina superior izq. → inferior der.). */
export function drawLddbiDiagonalFondo(
  doc: JsPDFDoc,
  primary: [number, number, number],
  accent: [number, number, number],
  reserveBottomMm = 0,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight() - reserveBottomMm;
  const steps = 18;

  for (let row = 0; row < steps; row++) {
    for (let col = 0; col < steps; col++) {
      const t = (row / (steps - 1) + col / (steps - 1)) / 2;
      const c = lerpRgb(primary, accent, t);
      const cw = pageW / steps + 0.2;
      const ch = pageH / steps + 0.2;
      doc.setFillColor(...c);
      doc.rect((pageW / steps) * col, (pageH / steps) * row, cw, ch, "F");
    }
  }

  doc.setDrawColor(30, 45, 70);
  doc.setLineWidth(0.25);
  doc.rect(0.4, 0.4, pageW - 0.8, pageH + reserveBottomMm - 0.8, "S");
  doc.setDrawColor(0);
}

/** Líneas diagonales geométricas (estilo mockup LDDBI). */
export function drawLddbiGeometricDiagonalLines(
  doc: JsPDFDoc,
  reserveBottomMm = 0,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight() - reserveBottomMm;
  const spacing = 3.2;
  const extend = pageW + pageH;

  const drawSet = (angleDeg: number, rgb: [number, number, number], width: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    doc.setDrawColor(...rgb);
    doc.setLineWidth(width);
    for (let i = -extend; i < extend; i += spacing) {
      const x0 = i;
      const y0 = 0;
      const len = extend * 1.4;
      doc.line(x0, y0, x0 + dx * len, y0 + dy * len);
    }
  };

  drawSet(32, [180, 210, 235], 0.06);
  drawSet(-58, [140, 180, 210], 0.05);
  drawSet(78, [200, 230, 245], 0.04);
  doc.setDrawColor(0);
}

/** Balón vectorial de respaldo cuando no hay PNG de marca de agua. */
function drawLddbiVectorBasketball(
  doc: JsPDFDoc,
  cx: number,
  cy: number,
  radius: number,
) {
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.circle(cx, cy, radius, "S");
  doc.line(cx - radius, cy, cx + radius, cy);
  if (typeof doc.ellipse === "function") {
    doc.ellipse(cx, cy, radius * 0.42, radius, "S");
    doc.ellipse(cx, cy, radius, radius * 0.42, "S");
  }
  doc.setDrawColor(0);
}

/**
 * Marca de agua de balón en anverso (centro, tenue).
 * Usa `sportGraphicPng` de la liga o dibujo vectorial de respaldo.
 */
export function drawLddbiAnversoBasketballWatermark(
  doc: JsPDFDoc,
  sportGraphicPng: string | null,
  bodyTopMm: number,
  bodyBottomMm: number,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const bodyH = bodyBottomMm - bodyTopMm;
  const size = Math.min(pageW * 0.48, bodyH * 0.72);
  const x = (pageW - size) / 2;
  const y = bodyTopMm + (bodyH - size) / 2;

  if (sportGraphicPng?.startsWith("data:image")) {
    try {
      const gState = doc.GState({ opacity: 0.14 });
      doc.setGState(gState);
      drawLogoFit(doc, sportGraphicPng, x, y, size, size);
      doc.setGState(doc.GState({ opacity: 1 }));
    } catch {
      drawLogoFit(doc, sportGraphicPng, x, y, size, size);
    }
    return;
  }

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.18);
  drawLddbiVectorBasketball(doc, x + size / 2, y + size / 2, size * 0.42);
  doc.setDrawColor(0);
}

/** Marca de agua en zona rectangular (reverso u otras áreas). */
export function drawLddbiZoneWatermark(
  doc: JsPDFDoc,
  sportGraphicPng: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (sportGraphicPng?.startsWith("data:image")) {
    try {
      doc.setGState(doc.GState({ opacity: 0.1 }));
      drawLogoFit(doc, sportGraphicPng, x + w * 0.08, y + h * 0.05, w * 0.84, h * 0.9);
      doc.setGState(doc.GState({ opacity: 1 }));
    } catch {
      drawLogoFit(doc, sportGraphicPng, x + w * 0.08, y + h * 0.05, w * 0.84, h * 0.9);
    }
    return;
  }
  drawLddbiVectorBasketball(doc, x + w / 2, y + h / 2, Math.min(w, h) * 0.38);
}

export function drawLddbiEncabezadoAnverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput) {
  const pageW = doc.internal.pageSize.getWidth();
  const m = CARNET_MARGEN_MM;
  const logoBox = LDDBI_HEADER_LOGO_MM;
  const logoY = (LDDBI_HEADER_MM - logoBox) / 2;
  const { lineaFederacion, lineaLiga } = resolveLddbiEncabezadoLineas(
    input.leagueDisplayName,
    input.theme.federationDisplayName,
    input.theme.showFederation,
  );

  const fedLogo = input.federacionLogoPngDataUrl ?? null;
  if (fedLogo) {
    drawLogoCover(doc, fedLogo, m, logoY, logoBox, logoBox);
  }

  drawLogoCover(
    doc,
    input.ligaLogoPngDataUrl,
    pageW - m - logoBox,
    logoY,
    logoBox,
    logoBox,
  );

  const sideReserve = logoBox;
  const centerMaxW = pageW - 2 * (m + sideReserve + 2.5);
  const cx = pageW / 2;
  const fedLineH = 2.65;
  const ligaLineH = 2.35;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT.headerFed);
  const fedLines = doc.splitTextToSize(lineaFederacion, centerMaxW);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT.headerLiga);
  const ligaLines = doc.splitTextToSize(lineaLiga, centerMaxW);

  const textBlockH = fedLines.length * fedLineH + ligaLines.length * ligaLineH;
  let y = Math.max(1.8, (LDDBI_HEADER_MM - textBlockH) / 2 + 1.1);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT.headerFed);
  doc.setTextColor(255, 255, 255);
  for (const line of fedLines) {
    doc.text(line, cx, y, { align: "center" });
    y += fedLineH;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT.headerLiga);
  doc.setTextColor(248, 252, 255);
  for (const line of ligaLines) {
    doc.text(line, cx, y, { align: "center" });
    y += ligaLineH;
  }
  doc.setTextColor(0);
}

export function drawLddbiFotoConMarco(
  doc: JsPDFDoc,
  fotoPng: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: [number, number, number],
) {
  const border = 1.1;
  doc.setFillColor(...accent);
  doc.roundedRect(x - border, y - border, w + border * 2, h + border * 2, 1.4, 1.4, "F");
  doc.setFillColor(...CARNET_PANEL_RGB);
  doc.roundedRect(x, y, w, h, 0.9, 0.9, "F");

  if (fotoPng?.startsWith("data:image")) {
    const pad = 0.3;
    let fmt: "PNG" | "JPEG" = "PNG";
    if (fotoPng.startsWith("data:image/jpeg") || fotoPng.startsWith("data:image/jpg")) {
      fmt = "JPEG";
    }
    doc.addImage({
      imageData: fotoPng,
      format: fmt,
      x: x + pad,
      y: y + pad,
      width: w - pad * 2,
      height: h - pad * 2,
      compression: "NONE",
    });
    return;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(140, 148, 160);
  doc.text("SIN FOTO", x + w / 2, y + h / 2, { align: "center", baseline: "middle" });
  doc.setTextColor(0);
}

export function drawLddbiCampoBlanco(
  doc: JsPDFDoc,
  etiqueta: string,
  valor: string,
  x: number,
  y: number,
  maxW: number,
  destacado = false,
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT.label);
  doc.setTextColor(195, 225, 245);
  doc.text(`${etiqueta}:`, x, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(destacado ? LDDBI_FONT.valueDestacado : LDDBI_FONT.value);
  doc.setTextColor(255, 255, 255);
  const valLines = doc.splitTextToSize(valor, maxW);
  const lineH = destacado ? 2.85 : 2.65;
  doc.text(valLines, x, y + lineH);
  doc.setTextColor(0);
}

/** Altura aproximada de una fila de datos (mm) para centrar el bloque en CR80. */
export function lddbiCampoRowHeightMm(destacado = false): number {
  return destacado ? 6.4 : 5.6;
}

export { CARNET_ANCHO_MM, CARNET_ALTO_MM, WHITE };
