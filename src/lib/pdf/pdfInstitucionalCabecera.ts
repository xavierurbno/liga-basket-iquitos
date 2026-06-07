import type { jsPDF } from "jspdf";
import {
  FICHA_HEADER_FEDERATION_LOGO_SCALE,
  FICHA_HEADER_LOGO_H_MM,
  FICHA_HEADER_LOGO_TOP_OFFSET_MM,
  FICHA_HEADER_LOGO_W_MM,
} from "@/lib/pdf/fichaHeaderLayout";
import {
  FICHA_T1,
  FICHA_T3,
  resolveFichaLeagueTitle,
} from "@/lib/pdf/fichaInstitucionalTextos";

/** Mismo margen X que logos Federación (izq.) y Liga (der.) — alineado con tablas. */
export const PAGE_X_MARGIN_MM = 14;

const IDENTITY_SEAL_MM = 18;

/** Marca de agua: logo liga centrado, 160 mm de ancho, opacidad 0.07. */
const WATERMARK_WIDTH_MM = 160;
const WATERMARK_OPACITY = 0.07;

export function drawLogoFit(
  doc: jsPDF,
  dataUrl: string | null,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  /** Escala del dibujo dentro de la caja (1 = ocupa el máximo posible). */
  contentScale = 1,
  verticalAlign: "center" | "top" = "center",
) {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return;
  let fmt: "PNG" | "JPEG" = "PNG";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    fmt = "JPEG";
  }
  const props = doc.getImageProperties(dataUrl);
  const ratio = props.width / props.height;
  const fitW = maxW * contentScale;
  const fitH = maxH * contentScale;
  let w = fitW;
  let h = w / ratio;
  if (h > fitH) {
    h = fitH;
    w = h * ratio;
  }
  const ox = x + (maxW - w) / 2;
  const oy = verticalAlign === "top" ? y : y + (maxH - h) / 2;
  doc.addImage({
    imageData: dataUrl,
    format: fmt,
    x: ox,
    y: oy,
    width: w,
    height: h,
    compression: "NONE",
  });
}

/** Llena el recuadro completo (equivalente a object-fit: cover) — logos con mismo tamaño visual. */
export function drawLogoCover(
  doc: jsPDF,
  dataUrl: string | null,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
) {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return;
  let fmt: "PNG" | "JPEG" = "PNG";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    fmt = "JPEG";
  }
  const props = doc.getImageProperties(dataUrl);
  const ratio = props.width / props.height;
  let w = boxW;
  let h = w / ratio;
  if (h < boxH) {
    h = boxH;
    w = h * ratio;
  }
  const ox = x + (boxW - w) / 2;
  const oy = y + (boxH - h) / 2;
  doc.addImage({
    imageData: dataUrl,
    format: fmt,
    x: ox,
    y: oy,
    width: w,
    height: h,
    compression: "NONE",
  });
}

type LogoCoverAnchor = "center" | "top-left" | "top-right";

/**
 * object-fit: cover anclado (p. ej. top-right en logo liga derecha) para no desbordar el CR80.
 */
export function drawLogoCoverAnchored(
  doc: jsPDF,
  dataUrl: string | null,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  anchor: LogoCoverAnchor = "center",
) {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return;
  let fmt: "PNG" | "JPEG" = "PNG";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    fmt = "JPEG";
  }
  const props = doc.getImageProperties(dataUrl);
  const ratio = props.width / props.height;
  let w = boxW;
  let h = w / ratio;
  if (h < boxH) {
    h = boxH;
    w = h * ratio;
  }

  let ox = x + (boxW - w) / 2;
  let oy = y + (boxH - h) / 2;
  if (anchor === "top-left") {
    ox = x;
    oy = y;
  } else if (anchor === "top-right") {
    ox = x + boxW - w;
    oy = y;
  }

  doc.addImage({
    imageData: dataUrl,
    format: fmt,
    x: ox,
    y: oy,
    width: w,
    height: h,
    compression: "NONE",
  });
}

export function drawMarcaAguaCentrada(doc: jsPDF, ligaLogoDataUrl: string | null) {
  if (!ligaLogoDataUrl) return;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let fmt: "PNG" | "JPEG" = "PNG";
  if (ligaLogoDataUrl.startsWith("data:image/jpeg") || ligaLogoDataUrl.startsWith("data:image/jpg")) {
    fmt = "JPEG";
  }
  const props = doc.getImageProperties(ligaLogoDataUrl);
  let wMm = WATERMARK_WIDTH_MM;
  let hMm = wMm * (props.height / props.width);
  const maxH = pageH - 24;
  if (hMm > maxH) {
    const s = maxH / hMm;
    hMm *= s;
    wMm *= s;
  }
  const x = (pageW - wMm) / 2;
  const y = (pageH - hMm) / 2;
  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: WATERMARK_OPACITY }));
  doc.addImage({
    imageData: ligaLogoDataUrl,
    format: fmt,
    x,
    y,
    width: wMm,
    height: hMm,
    compression: "NONE",
  });
  doc.restoreGraphicsState();
}

function drawLineaSeparadoraEditorial(doc: jsPDF, y: number, pageW: number, margin: number) {
  doc.setDrawColor(210, 210, 212);
  doc.setLineWidth(0.12);
  doc.line(margin, y, pageW - margin, y);
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
}

export type PdfCabeceraInstitucionalInput = {
  federacionLogoPngDataUrl: string | null;
  ligaLogoPngDataUrl: string | null;
  /** Segunda línea (nombre de la liga). Por defecto FICHA_T2 (Iquitos). */
  leagueTitleLine?: string;
  /** Tercera línea centrada (por defecto FICHA_T3). */
  documentTitle?: string;
  /** Líneas en negrita bajo el separador (p. ej. CLUB / CATEGORÍA o TORNEO). */
  identityLines: string[];
  /** Logo a la derecha de la fila identidad (sello club o logo liga). */
  rightLogoPngDataUrl?: string | null;
};

export type CabeceraInstitucionalMetrics = {
  pageW: number;
  margin: number;
  sideW: number;
  centerX: number;
  centerMaxW: number;
  bandH: number;
  lines1: string[];
  lines2: string[];
  lineH14: number;
  lineH12: number;
  gapTitulos: number;
  gapBeforeT3: number;
  gapAfterLiga: number;
  lineT3: number;
  blockH: number;
  gapAfterTitlesBand: number;
  gapAfterSeparator: number;
  gapIdentityToTable: number;
  identityDataLines: string[];
  lineData11: number;
  gapBetweenIdentityLines: number;
  identityRowH: number;
  alturaHastaInicioTabla: number;
  documentTitle: string;
};

export function calcCabeceraInstitucionalMetrics(
  doc: jsPDF,
  input: Pick<PdfCabeceraInstitucionalInput, "identityLines" | "documentTitle" | "leagueTitleLine">
): CabeceraInstitucionalMetrics {
  const documentTitle = input.documentTitle ?? FICHA_T3;
  const leagueTitleLine = resolveFichaLeagueTitle(input.leagueTitleLine);
  const pageW = doc.internal.pageSize.getWidth();
  const margin = PAGE_X_MARGIN_MM;
  const sideW = 30;
  const centerX = pageW / 2;
  const centerMaxW = pageW - margin * 2 - sideW * 2 - 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const lines1 = doc.splitTextToSize(FICHA_T1, centerMaxW);
  doc.setFontSize(12);
  const lines2 = doc.splitTextToSize(leagueTitleLine, centerMaxW);

  const lineH14 = 5.5;
  const lineH12 = 4.8;
  const gapTitulos = 3.5;
  const gapAfterLiga = 1.2;
  const gapBeforeT3 = 1.4;
  const lineT3 = 5.2;

  const blockH =
    lines1.length * lineH14 +
    gapTitulos +
    lines2.length * lineH12 +
    gapAfterLiga +
    gapBeforeT3 +
    lineT3;
  const bandH = Math.max(38, blockH + 12);

  const gapAfterTitlesBand = 2;
  const gapAfterSeparator = 1;
  const gapIdentityToTable = 1;
  const lineData11 = 5.5;
  const gapBetweenIdentityLines = 1.2;

  const sealMm = IDENTITY_SEAL_MM;
  const dataMaxW = pageW - 2 * margin - sealMm - 4;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  const identityDataLines: string[] = [];
  let textBlockH = 0;
  for (let i = 0; i < input.identityLines.length; i++) {
    const wrapped = doc.splitTextToSize(input.identityLines[i]!, dataMaxW);
    identityDataLines.push(...wrapped);
    textBlockH += wrapped.length * lineData11;
    if (i < input.identityLines.length - 1) {
      textBlockH += gapBetweenIdentityLines;
    }
  }
  const identityRowH = Math.max(sealMm, textBlockH);

  const alturaHastaInicioTabla =
    bandH + gapAfterTitlesBand + gapAfterSeparator + identityRowH + gapIdentityToTable;

  return {
    pageW,
    margin,
    sideW,
    centerX,
    centerMaxW,
    bandH,
    lines1,
    lines2,
    lineH14,
    lineH12,
    gapTitulos,
    gapBeforeT3,
    gapAfterLiga,
    lineT3,
    blockH,
    gapAfterTitlesBand,
    gapAfterSeparator,
    gapIdentityToTable,
    identityDataLines,
    lineData11,
    gapBetweenIdentityLines,
    identityRowH,
    alturaHastaInicioTabla,
    documentTitle,
  };
}

/** Fed | T1+T2+título | Liga → línea → identidad (izq.) + logo (der.). */
export function drawCabeceraInstitucional(
  doc: jsPDF,
  input: PdfCabeceraInstitucionalInput,
  headerTop: number,
  m: CabeceraInstitucionalMetrics
) {
  const y0 = headerTop;
  const textBlockTop = y0 + (m.bandH - m.blockH) / 2;
  const logoBoxTop = textBlockTop + FICHA_HEADER_LOGO_TOP_OFFSET_MM;

  drawLogoFit(
    doc,
    input.federacionLogoPngDataUrl,
    m.margin,
    logoBoxTop,
    FICHA_HEADER_LOGO_W_MM,
    FICHA_HEADER_LOGO_H_MM,
    FICHA_HEADER_FEDERATION_LOGO_SCALE,
    "top",
  );
  drawLogoFit(
    doc,
    input.ligaLogoPngDataUrl,
    m.pageW - m.margin - FICHA_HEADER_LOGO_W_MM,
    logoBoxTop,
    FICHA_HEADER_LOGO_W_MM,
    FICHA_HEADER_LOGO_H_MM,
    1,
    "top",
  );

  let yy = textBlockTop + m.lineH14 * 0.85;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(m.lines1, m.centerX, yy, { align: "center" });
  yy += m.lines1.length * m.lineH14 + m.gapTitulos;
  doc.setFontSize(12);
  doc.text(m.lines2, m.centerX, yy, { align: "center" });
  yy += m.lines2.length * m.lineH12 + m.gapAfterLiga;
  yy += m.gapBeforeT3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(m.documentTitle, m.centerX, yy, { align: "center" });

  const yLine = y0 + m.bandH + m.gapAfterTitlesBand;
  drawLineaSeparadoraEditorial(doc, yLine, m.pageW, m.margin);

  const yRowTop = yLine + m.gapAfterSeparator;
  if (input.identityLines.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const dataMaxW = dataMaxWForIdentity(m);
    let bl = yRowTop + m.lineData11;
    for (let i = 0; i < input.identityLines.length; i++) {
      const wrapped = doc.splitTextToSize(input.identityLines[i]!, dataMaxW);
      doc.text(wrapped, m.margin, bl);
      bl += wrapped.length * m.lineData11;
      if (i < input.identityLines.length - 1) {
        bl += m.gapBetweenIdentityLines;
      }
    }
  }

  if (input.rightLogoPngDataUrl) {
    const sealY = yRowTop + (m.identityRowH - IDENTITY_SEAL_MM) / 2;
    drawLogoFit(
      doc,
      input.rightLogoPngDataUrl,
      m.pageW - m.margin - IDENTITY_SEAL_MM,
      sealY,
      IDENTITY_SEAL_MM,
      IDENTITY_SEAL_MM
    );
  }
}

function dataMaxWForIdentity(m: CabeceraInstitucionalMetrics): number {
  return m.pageW - 2 * m.margin - IDENTITY_SEAL_MM - 4;
}
