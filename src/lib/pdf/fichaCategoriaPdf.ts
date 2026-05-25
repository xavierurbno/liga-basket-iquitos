import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { calcularEdad } from "@/lib/utils/age";
import { FOTO_CELDA_ALTO_MM, FOTO_CELDA_ANCHO_MM } from "@/lib/pdf/fichaLayout";
import {
  FICHA_COLUMNAS_TABLA,
  resolveFichaLeagueTitle,
} from "@/lib/pdf/fichaInstitucionalTextos";
import {
  PAGE_X_MARGIN_MM,
  calcCabeceraInstitucionalMetrics,
  drawCabeceraInstitucional,
  drawMarcaAguaCentrada,
  type CabeceraInstitucionalMetrics,
} from "@/lib/pdf/pdfInstitucionalCabecera";

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
  /** Nombre oficial de la liga (cabecera T2 y pie de página). */
  leagueDisplayName: string;
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

const FOOTER_FONT_SIZE = 7;
const FOOTER_TEXT_COLOR: [number, number, number] = [75, 85, 99];

function calcCabeceraCompactaMetrics(
  doc: jsPDF,
  categoriaDetalle: string,
  clubName: string,
  leagueDisplayName: string
): CabeceraInstitucionalMetrics {
  return calcCabeceraInstitucionalMetrics(doc, {
    leagueTitleLine: leagueDisplayName,
    identityLines: [
      `CLUB: ${clubName.trim().toUpperCase()}`,
      `CATEGORÍA: ${categoriaDetalle.toUpperCase()}`,
    ],
  });
}

function drawCabeceraPrimerPagina(
  doc: jsPDF,
  input: FichaCategoriaPdfInput,
  headerTop: number,
  m: CabeceraInstitucionalMetrics
) {
  drawCabeceraInstitucional(
    doc,
    {
      federacionLogoPngDataUrl: input.federacionLogoPngDataUrl,
      ligaLogoPngDataUrl: input.ligaLogoPngDataUrl,
      leagueTitleLine: input.leagueDisplayName,
      identityLines: [
        `CLUB: ${input.clubName.trim().toUpperCase()}`,
        `CATEGORÍA: ${input.categoriaDetalle.toUpperCase()}`,
      ],
      rightLogoPngDataUrl: input.clubLogoPngDataUrl,
    },
    headerTop,
    m
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

function drawFooterTrazabilidad(
  doc: jsPDF,
  generatedAtIso: string,
  leagueDisplayName: string,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const leagueLabel = resolveFichaLeagueTitle(leagueDisplayName);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FOOTER_FONT_SIZE);
  doc.setTextColor(...FOOTER_TEXT_COLOR);
  doc.text(
    `${leagueLabel} | Generado el: ${formatFechaHoraTrazabilidad(generatedAtIso)}`,
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
  const cabeceraMetrics = calcCabeceraCompactaMetrics(
    doc,
    input.categoriaDetalle,
    input.clubName,
    input.leagueDisplayName,
  );
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
      drawFooterTrazabilidad(data.doc as jsPDF, generatedAtIso, input.leagueDisplayName);
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
    drawFooterTrazabilidad(doc, generatedAtIso, input.leagueDisplayName);
    finalY = 20;
  }

  drawPieStaff(doc, finalY + 10, input.entrenador, input.delegado);
  drawValidationQr(doc, input.validationQrPngDataUrl);

  return doc.output("blob");
}
