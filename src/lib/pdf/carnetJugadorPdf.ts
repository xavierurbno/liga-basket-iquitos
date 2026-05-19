import { jsPDF } from "jspdf";
import { FICHA_T2 } from "@/lib/pdf/fichaInstitucionalTextos";
import {
  CARNET_ALTO_MM,
  CARNET_ANCHO_MM,
  CARNET_FOTO_ALTO_MM,
  CARNET_FOTO_ANCHO_MM,
  CARNET_FRANJA_ALTO_MM,
  CARNET_MARGEN_MM,
  CARNET_QR_MM,
} from "@/lib/pdf/carnetLayout";
import { drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";

export type CarnetJugadorInput = {
  playerId: string;
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  fechaNacimientoIso: string;
  clubName: string;
  categoriaNombre: string;
  carnetNumber: string | null;
  fotoPngDataUrl: string | null;
  ligaLogoPngDataUrl: string | null;
  clubLogoPngDataUrl: string | null;
  validationQrPngDataUrl?: string | null;
  generatedAtIso?: string;
};

const FRANJA_FILL: [number, number, number] = [37, 99, 235];
const NAVY: [number, number, number] = [15, 23, 42];
const GRAY: [number, number, number] = [71, 85, 105];

function fmtFechaPeru(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function drawFotoJugador(
  doc: jsPDF,
  fotoPngDataUrl: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  doc.setDrawColor(200, 202, 206);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  if (fotoPngDataUrl?.startsWith("data:image")) {
    const s = Math.min(w / CARNET_FOTO_ANCHO_MM, h / CARNET_FOTO_ALTO_MM, 1);
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
  doc.setFontSize(6);
  doc.setTextColor(140);
  doc.text("SIN FOTO", x + w / 2, y + h / 2, { align: "center", baseline: "middle" });
  doc.setTextColor(0);
}

function drawFranjaInstitucional(doc: jsPDF, ligaLogoPngDataUrl: string | null) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...FRANJA_FILL);
  doc.rect(0, 0, pageW, CARNET_FRANJA_ALTO_MM, "F");

  const logoSlot = 7.5;
  drawLogoFit(doc, ligaLogoPngDataUrl, CARNET_MARGEN_MM, 0.8, logoSlot, CARNET_FRANJA_ALTO_MM - 1.6);

  const textX = CARNET_MARGEN_MM + logoSlot + 1.5;
  const textMaxW = pageW - textX - CARNET_MARGEN_MM;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  const titulo = doc.splitTextToSize("CREDENCIAL DEPORTISTA", textMaxW);
  doc.text(titulo, textX, 3.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.6);
  const liga = doc.splitTextToSize(FICHA_T2, textMaxW);
  doc.text(liga, textX, 7.2);
  doc.setTextColor(0);
}

function drawDatosJugador(
  doc: jsPDF,
  input: CarnetJugadorInput,
  x: number,
  y: number,
  maxW: number,
) {
  const nombreCompleto = `${input.lastname}, ${input.name}`.trim().toUpperCase();
  let yy = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(...NAVY);
  const lineasNombre = doc.splitTextToSize(nombreCompleto, maxW);
  doc.text(lineasNombre, x, yy);
  yy += lineasNombre.length * 3.6 + 1.2;

  const filas: [string, string][] = [
    ["DOC.", `${input.documentType} ${input.documentNumber}`],
    ["NAC.", fmtFechaPeru(input.fechaNacimientoIso)],
    ["CLUB", input.clubName.trim().toUpperCase()],
    ["CAT.", input.categoriaNombre.trim().toUpperCase()],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  for (const [etq, val] of filas) {
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "bold");
    doc.text(etq, x, yy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...NAVY);
    const valLines = doc.splitTextToSize(val, maxW - 9);
    doc.text(valLines, x + 9, yy);
    yy += Math.max(valLines.length * 3.1, 3.4);
  }

  if (input.carnetNumber?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.setTextColor(...FRANJA_FILL);
    doc.text(`N° ${input.carnetNumber.trim()}`, x, yy + 0.5);
  }

  doc.setTextColor(0);
}

function drawQr(doc: jsPDF, validationQrPngDataUrl: string | null | undefined) {
  if (!validationQrPngDataUrl?.startsWith("data:image")) return;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const x = pageW - CARNET_MARGEN_MM - CARNET_QR_MM;
  const y = pageH - CARNET_MARGEN_MM - CARNET_QR_MM;
  doc.addImage({
    imageData: validationQrPngDataUrl,
    format: "PNG",
    x,
    y,
    width: CARNET_QR_MM,
    height: CARNET_QR_MM,
    compression: "NONE",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(...GRAY);
  doc.text("Validar", x + CARNET_QR_MM / 2, y + CARNET_QR_MM + 1.8, { align: "center" });
  doc.setTextColor(0);
}

/**
 * Genera el PDF del carnet individual CR80 (anverso, horizontal).
 * Las imágenes deben llegar como data URLs (ver `GenerateCarnetPDF.tsx`).
 */
export function generarCarnetJugadorPdf(input: CarnetJugadorInput): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [CARNET_ANCHO_MM, CARNET_ALTO_MM],
    compress: false,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const bodyTop = CARNET_FRANJA_ALTO_MM + 1.2;

  drawFranjaInstitucional(doc, input.ligaLogoPngDataUrl);

  const fotoX = CARNET_MARGEN_MM;
  const fotoY = bodyTop;
  const fotoW = CARNET_FOTO_ANCHO_MM;
  const fotoH = CARNET_FOTO_ALTO_MM;
  drawFotoJugador(doc, input.fotoPngDataUrl, fotoX, fotoY, fotoW, fotoH);

  const datosX = fotoX + fotoW + 2.5;
  const datosMaxW = pageW - datosX - CARNET_MARGEN_MM - CARNET_QR_MM - 1.5;
  drawDatosJugador(doc, input, datosX, fotoY + 1.5, datosMaxW);

  const clubLogoSize = 10;
  drawLogoFit(
    doc,
    input.clubLogoPngDataUrl,
    pageW - CARNET_MARGEN_MM - clubLogoSize,
    bodyTop,
    clubLogoSize,
    clubLogoSize,
  );

  drawQr(doc, input.validationQrPngDataUrl);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.8);
  doc.setTextColor(150);
  doc.text("LDDBI", CARNET_MARGEN_MM, pageH - 1.2);
  doc.setTextColor(0);

  return doc.output("blob");
}
