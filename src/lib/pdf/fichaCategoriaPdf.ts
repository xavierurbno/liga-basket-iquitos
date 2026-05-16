import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { calcularEdad } from "@/lib/utils/age";
import { FOTO_CELDA_ALTO_MM, FOTO_CELDA_ANCHO_MM } from "@/lib/pdf/fichaLayout";
import {
  FICHA_COLUMNAS_TABLA,
  FICHA_T1 as T1,
  FICHA_T2 as T2,
  FICHA_T3 as T3,
} from "@/lib/pdf/fichaInstitucionalTextos";

export type FichaPdfJugadorInput = {
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  fechaNacimientoIso: string;
  fotoPngDataUrl: string | null;
  /** Número de camiseta / polo */
  jerseyNumber: number | null;
};

export type FichaPdfStaffInput = {
  etiqueta: string;
  nombreCompleto: string;
  documentType: string | null;
  documentNumber: string | null;
  fotoPngDataUrl: string | null;
};

export type FichaCategoriaPdfInput = {
  /** Nombre del club (línea "CLUB: …" en cabecera) */
  clubName: string;
  /** Ej. "U9 - MIXTO" (se imprime como CATEGORÍA: …) */
  categoriaDetalle: string;
  federacionLogoPngDataUrl: string | null;
  /** Logo liga (cabecera + marca de agua en PDF con opacidad 0.07, sin rotación). */
  ligaLogoPngDataUrl: string | null;
  /** Sello del club (fila identidad, derecha). */
  clubLogoPngDataUrl: string | null;
  entrenador: FichaPdfStaffInput;
  delegado: FichaPdfStaffInput;
  players: FichaPdfJugadorInput[];
  /** Fecha/hora de emisión para trazabilidad. */
  generatedAtIso?: string;
  /** QR opcional para validación en sistema. */
  validationQrPngDataUrl?: string | null;
};

/** Encabezado de tabla: azul marino #1e3a5f */
const HEAD_FILL: [number, number, number] = [37, 99, 235];
/** Acento “azul eléctrico” (#0070f3) — borde inferior del encabezado. */
const HEAD_ACCENT_ELECTRIC: [number, number, number] = [0, 112, 243];

/** Mismo valor que el margen X de los logos Federación (izq) y Liga (der) — regla de alineación con la tabla. */
const PAGE_X_MARGIN_MM = 14;
const FOOTER_FONT_SIZE = 7;
const FOOTER_TEXT_COLOR: [number, number, number] = [75, 85, 99];

function drawLogoFit(
  doc: jsPDF,
  dataUrl: string | null,
  x: number,
  y: number,
  maxW: number,
  maxH: number
) {
  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    // Fallback silencioso: no dibujamos nada para mantener la limpieza editorial
    return;
  }
  let fmt: "PNG" | "JPEG" = "PNG";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    fmt = "JPEG";
  }
  const props = doc.getImageProperties(dataUrl);
  const ratio = props.width / props.height;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  const ox = x + (maxW - w) / 2;
  const oy = y + (maxH - h) / 2;
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

/** Marca de agua: logo liga centrado, 160 mm de ancho, 0°, opacidad 0.07 — siempre detrás del contenido. */
const WATERMARK_WIDTH_MM = 160;
const WATERMARK_OPACITY = 0.07;

function drawMarcaAguaCentrada(doc: jsPDF, ligaLogoDataUrl: string | null) {
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

/** Métricas compartidas entre el dibujo del encabezado y `tablaStartY`. */
type CabeceraCompactaMetrics = {
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
  clubDataLines: string[];
  catDataLines: string[];
  lineData11: number;
  gapClubCat: number;
  identityRowH: number;
  /** Offset desde `headerTop` hasta la Y donde empieza la tabla de players. */
  alturaHastaInicioTabla: number;
};

function calcCabeceraCompactaMetrics(
  doc: jsPDF,
  categoriaDetalle: string,
  clubName: string
): CabeceraCompactaMetrics {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = PAGE_X_MARGIN_MM;
  const sideW = 30;
  const centerX = pageW / 2;
  const centerMaxW = pageW - margin * 2 - sideW * 2 - 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const lines1 = doc.splitTextToSize(T1, centerMaxW);
  doc.setFontSize(12);
  const lines2 = doc.splitTextToSize(T2, centerMaxW);

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
  const gapClubCat = 1.2;

  const sealMm = 18;
  const dataMaxW = pageW - 2 * margin - sealMm - 4;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const clubDataLines = doc.splitTextToSize(`CLUB: ${clubName.trim().toUpperCase()}`, dataMaxW);
  const catDataLines = doc.splitTextToSize(`CATEGORÍA: ${categoriaDetalle.toUpperCase()}`, dataMaxW);

  const textBlockH =
    clubDataLines.length * lineData11 + gapClubCat + catDataLines.length * lineData11;
  const identityRowH = Math.max(sealMm, textBlockH);

  const alturaHastaInicioTabla =
    bandH +
    gapAfterTitlesBand +
    gapAfterSeparator +
    identityRowH +
    gapIdentityToTable;

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
    clubDataLines,
    catDataLines,
    lineData11,
    gapClubCat,
    identityRowH,
    alturaHastaInicioTabla,
  };
}

function drawLineaSeparadoraEditorial(doc: jsPDF, y: number, pageW: number, margin: number) {
  doc.setDrawColor(210, 210, 212);
  doc.setLineWidth(0.12);
  doc.line(margin, y, pageW - margin, y);
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
}

const IDENTITY_SEAL_MM = 18;

/**
 * Fed | T1+T2+T3 | Liga → línea → CLUB / CATEGORÍA (izq.) + sello club (der.).
 */
function drawCabeceraPrimerPagina(
  doc: jsPDF,
  input: FichaCategoriaPdfInput,
  headerTop: number,
  m: CabeceraCompactaMetrics
) {
  const y0 = headerTop;

  drawLogoFit(doc, input.federacionLogoPngDataUrl, m.margin, y0, m.sideW, m.bandH);
  drawLogoFit(doc, input.ligaLogoPngDataUrl, m.pageW - m.margin - m.sideW, y0, m.sideW, m.bandH);

  let yy = y0 + (m.bandH - m.blockH) / 2 + m.lineH14 * 0.85;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(m.lines1, m.centerX, yy, { align: "center" });
  yy += m.lines1.length * m.lineH14 + m.gapTitulos;
  doc.setFontSize(12);
  doc.text(m.lines2, m.centerX, yy, { align: "center" });
  yy += m.lines2.length * m.lineH12 + m.gapAfterLiga;
  yy += m.gapBeforeT3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(T3, m.centerX, yy, { align: "center" });

  const yLine = y0 + m.bandH + m.gapAfterTitlesBand;
  drawLineaSeparadoraEditorial(doc, yLine, m.pageW, m.margin);

  const yRowTop = yLine + m.gapAfterSeparator;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  let bl = yRowTop + m.lineData11;
  doc.text(m.clubDataLines, m.margin, bl);
  bl += m.clubDataLines.length * m.lineData11 + m.gapClubCat;
  doc.text(m.catDataLines, m.margin, bl);

  const sealY = yRowTop + (m.identityRowH - IDENTITY_SEAL_MM) / 2;
  drawLogoFit(
    doc,
    input.clubLogoPngDataUrl,
    m.pageW - m.margin - IDENTITY_SEAL_MM,
    sealY,
    IDENTITY_SEAL_MM,
    IDENTITY_SEAL_MM
  );
}

function drawPieStaff(doc: jsPDF, startY: number, entrenador: FichaPdfStaffInput, delegado: FichaPdfStaffInput) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = PAGE_X_MARGIN_MM;
  const colW = (pageW - margin * 2 - 10) / 2;
  const fotoMm = 28;
  let y = startY;

  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Responsables", margin, y);
  y += 8;

  const bloque = (x: number, staff: FichaPdfStaffInput) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(staff.etiqueta, x, y);
    let yy = y + 5;
    if (staff.fotoPngDataUrl) {
      doc.addImage({
        imageData: staff.fotoPngDataUrl,
        format: "PNG",
        x,
        y: yy,
        width: fotoMm,
        height: fotoMm * 1.15,
        compression: "NONE",
      });
      yy += fotoMm * 1.15 + 3;
    } else {
      doc.setDrawColor(200);
      doc.rect(x, yy, fotoMm, fotoMm * 1.05);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(140);
      doc.text("Sin foto", x + fotoMm / 2, yy + (fotoMm * 1.05) / 2, { align: "center", baseline: "middle" });
      doc.setTextColor(0);
      yy += fotoMm * 1.05 + 3;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const name = staff.nombreCompleto.trim() || "—";
    const lineas = doc.splitTextToSize(name, colW - 2);
    doc.text(lineas, x, yy);
    yy += lineas.length * 4.5 + 1;
    if (staff.documentNumber) {
      doc.setFontSize(8);
      doc.setTextColor(60);
      doc.text(`${staff.documentType || "DOC"}: ${staff.documentNumber}`, x, yy);
      doc.setTextColor(0);
    }
  };

  bloque(margin, entrenador);
  bloque(margin + colW + 10, delegado);
}

function formatFechaHoraTrazabilidad(iso: string): string {
  const base = new Date(iso);
  const d = Number.isNaN(base.getTime()) ? new Date() : base;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} a las ${hh}:${mi}`;
}

function drawFooterTrazabilidad(doc: jsPDF, generatedAtIso: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FOOTER_FONT_SIZE);
  doc.setTextColor(...FOOTER_TEXT_COLOR);
  doc.text(
    `Liga Deportiva de Basket de Iquitos | Generado el: ${formatFechaHoraTrazabilidad(generatedAtIso)}`,
    pageW / 2,
    pageH - 5,
    { align: "center", baseline: "middle" }
  );
  doc.setTextColor(0, 0, 0);
}

function drawValidationQr(doc: jsPDF, validationQrPngDataUrl: string | null | undefined) {
  if (!validationQrPngDataUrl) return;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const qrSize = 16;
  const x = pageW - PAGE_X_MARGIN_MM - qrSize;
  const y = pageH - 36;
  doc.addImage({
    imageData: validationQrPngDataUrl,
    format: "PNG",
    x,
    y,
    width: qrSize,
    height: qrSize,
    compression: "NONE",
  });
}

type LastAutoTable = { finalY: number };

function fmtFechaPeru(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Anchos que suman exactamente `innerW` (borde N° = margen Fed; borde Foto = borde Liga). */
function buildColumnStylesFullWidth(innerW: number) {
  const wNum = 10;
  const wFoto = Math.round(Math.min(FOTO_CELDA_ANCHO_MM + 2.8, innerW * 0.13) * 10) / 10;
  const rest = innerW - wNum - wFoto;
  let wName = Math.round(rest * 0.38 * 10) / 10;
  const wDni = Math.round(rest * 0.15 * 10) / 10;
  const wFecha = Math.round(rest * 0.19 * 10) / 10;
  const wEdad = Math.round(rest * 0.09 * 10) / 10;
  const wPolo = Math.round((rest - wName - wDni - wFecha - wEdad) * 10) / 10;
  const sum = wNum + wName + wDni + wFecha + wEdad + wPolo + wFoto;
  if (Math.abs(sum - innerW) > 0.001) {
    wName = Math.round((wName + innerW - sum) * 10) / 10;
  }
  return {
    0: { cellWidth: wNum, halign: "center" as const },
    1: { cellWidth: wName, halign: "center" as const },
    2: { cellWidth: wDni, halign: "center" as const },
    3: { cellWidth: wFecha, halign: "center" as const },
    4: { cellWidth: wEdad, halign: "center" as const },
    5: { cellWidth: wPolo, halign: "center" as const },
    6: { cellWidth: wFoto, minCellWidth: wFoto, halign: "center" as const },
  };
}

export function generarFichaCategoriaPdf(input: FichaCategoriaPdfInput): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: false,
  });

  const headerTop = PAGE_X_MARGIN_MM;
  const pageW = doc.internal.pageSize.getWidth();
  const innerW = pageW - 2 * PAGE_X_MARGIN_MM;
  const columnStylesTabla = buildColumnStylesFullWidth(innerW);
  const cabeceraMetrics = calcCabeceraCompactaMetrics(doc, input.categoriaDetalle, input.clubName);
  const generatedAtIso = input.generatedAtIso ?? new Date().toISOString();
  /** Posición Y donde debe empezar la tabla (sin conflicto con otros `startY` legacy). */
  const tablaStartY = headerTop + cabeceraMetrics.alturaHastaInicioTabla;

  const sorted = [...input.players].sort((a, b) => {
    const ap = a.lastname.localeCompare(b.lastname, "es", { sensitivity: "base" });
    if (ap !== 0) return ap;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  const fotosOrdenadas = sorted.map((j) => j.fotoPngDataUrl);

  const COL_FOTO = 6;

  const head = [Array.from(FICHA_COLUMNAS_TABLA)];

  const body = sorted.map((j, idx) => {
    const fn = new Date(j.fechaNacimientoIso);
    const edad = Number.isNaN(fn.getTime()) ? "—" : String(calcularEdad(fn));
    const nombreCompleto = `${j.lastname}, ${j.name}`.toUpperCase();
    const polo = j.jerseyNumber != null ? String(j.jerseyNumber) : "—";
    return [
      String(idx + 1).toUpperCase(),
      nombreCompleto.toUpperCase(),
      j.documentNumber,
      fmtFechaPeru(j.fechaNacimientoIso),
      edad,
      polo,
      "",
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: tablaStartY,
    tableWidth: innerW,
    theme: "plain",
    tableLineWidth: 0.08,
    tableLineColor: [200, 202, 206],
    margin: {
      top: headerTop,
      right: PAGE_X_MARGIN_MM,
      bottom: 12,
      left: PAGE_X_MARGIN_MM,
    },
    styles: {
      fontSize: 8,
      cellPadding: 1.35,
      valign: "middle",
      fillColor: false,
      lineColor: [198, 200, 204],
      lineWidth: 0.06,
    },
    headStyles: {
      fillColor: HEAD_FILL,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      valign: "middle",
      lineColor: [42, 68, 108],
      lineWidth: 0.06,
    },
    alternateRowStyles: { fillColor: false },
    columnStyles: columnStylesTabla,
    // Marca de agua en willDrawPage (antes del contenido de la página). didDrawPage corre después y taparía la tabla.
    willDrawPage: (data) => {
      drawMarcaAguaCentrada(data.doc as jsPDF, input.ligaLogoPngDataUrl);
      if (data.pageNumber === 1) {
        drawCabeceraPrimerPagina(data.doc as jsPDF, input, headerTop, cabeceraMetrics);
      }
    },
    didDrawPage: (data) => {
      drawFooterTrazabilidad(data.doc as jsPDF, generatedAtIso);
    },
    willDrawCell: (data) => {
      if (data.section === "body" && (data.column.index === 0 || data.column.index === 1)) {
        data.cell.text = data.cell.text.map((t) => String(t).toUpperCase());
      }
    },
    didDrawCell: (data) => {
      if (data.section === "head") {
        const d = data.doc as jsPDF;
        const c = data.cell;
        d.saveGraphicsState();
        d.setDrawColor(...HEAD_ACCENT_ELECTRIC);
        d.setLineWidth(0.42);
        d.setLineCap("round");
        const yAccent = c.y + c.height - 0.08;
        d.line(c.x + 0.2, yAccent, c.x + c.width - 0.2, yAccent);
        d.setLineWidth(0.14);
        d.line(c.x + 0.35, c.y + 0.16, c.x + c.width - 0.35, c.y + 0.16);
        d.restoreGraphicsState();
      }
      if (data.section === "body" && data.column.index === COL_FOTO) {
        const img = fotosOrdenadas[data.row.index];
        if (img) {
          const cell = data.cell;
          const pad = 0.5;
          const maxW = cell.width - 2 * pad;
          const maxH = cell.height - 2 * pad;
          const s = Math.min(maxW / FOTO_CELDA_ANCHO_MM, maxH / FOTO_CELDA_ALTO_MM, 1);
          const w = FOTO_CELDA_ANCHO_MM * s;
          const h = FOTO_CELDA_ALTO_MM * s;
          const x = cell.x + (cell.width - w) / 2;
          const y = cell.y + (cell.height - h) / 2;
          (data.doc as jsPDF).addImage({
            imageData: img,
            format: "PNG",
            x,
            y,
            width: w,
            height: h,
            compression: "NONE",
          });
        }
      }
    },
    bodyStyles: { fillColor: false, minCellHeight: FOTO_CELDA_ALTO_MM + 2 },
  });

  const last = (doc as unknown as { lastAutoTable?: LastAutoTable }).lastAutoTable;
  let finalY = last?.finalY ?? tablaStartY + 40;

  const pieAltoEstimado = 52;
  if (finalY + pieAltoEstimado > doc.internal.pageSize.getHeight() - 16) {
    doc.addPage();
    drawMarcaAguaCentrada(doc, input.ligaLogoPngDataUrl);
    drawFooterTrazabilidad(doc, generatedAtIso);
    finalY = 20;
  }

  drawPieStaff(doc, finalY + 10, input.entrenador, input.delegado);
  drawValidationQr(doc, input.validationQrPngDataUrl);

  return doc.output("blob");
}
