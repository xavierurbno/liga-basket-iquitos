import type { jsPDF as JsPDFDoc } from "jspdf";
import { extractCarnetYear } from "@/lib/carnet/carnetColors";
import { formatGeneroCarnetEtiqueta } from "@/lib/carnet/carnetInstitucionalText";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { CARNET_MARGEN_MM } from "@/lib/pdf/carnetLayout";
import { fmtFechaCarnetPeru, WHITE } from "@/lib/pdf/carnet/carnetPdfShared";
import { LDDBI_FONT } from "@/lib/carnet/lddbiPremiumTheme";
import {
  drawLddbiAnversoBasketballWatermark,
  drawLddbiCampoBlanco,
  drawLddbiDiagonalFondo,
  drawLddbiEncabezadoAnverso,
  drawLddbiFotoConMarco,
  drawLddbiGeometricDiagonalLines,
  lddbiCampoRowHeightMm,
  LDDBI_ACCENT_BAND_MM,
  LDDBI_HEADER_MM,
} from "@/lib/pdf/carnet/lddbi/carnetLddbiShared";

export function drawCarnetLddbiAnverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const primary = input.theme.primaryRgb;
  const accent = input.theme.accentRgb;

  const bodyTop = LDDBI_HEADER_MM + 1.5;
  const bodyBottom = pageH - CARNET_MARGEN_MM - LDDBI_ACCENT_BAND_MM;

  drawLddbiDiagonalFondo(doc, primary, accent, LDDBI_ACCENT_BAND_MM);
  drawLddbiGeometricDiagonalLines(doc, LDDBI_ACCENT_BAND_MM);
  drawLddbiAnversoBasketballWatermark(
    doc,
    input.sportGraphicPngDataUrl,
    bodyTop,
    bodyBottom,
  );

  drawLddbiEncabezadoAnverso(doc, input);
  const fotoW = 21;
  const fotoH = 25;
  const fotoX = pageW - CARNET_MARGEN_MM - fotoW;
  const fotoY = bodyTop + (bodyBottom - bodyTop - fotoH) / 2 - 1;

  const datosX = CARNET_MARGEN_MM + 1;
  const datosW = fotoX - datosX - 3;

  const apellidos = `${input.apellidoPaterno} ${input.apellidoMaterno}`.trim();
  const campos: { etq: string; val: string; destacado?: boolean }[] = [
    { etq: "APELLIDOS", val: apellidos, destacado: true },
    { etq: "NOMBRES", val: input.name.trim().toUpperCase() },
    { etq: "DNI", val: input.documentNumber.trim() },
    { etq: "F. DE NAC.", val: fmtFechaCarnetPeru(input.fechaNacimientoIso) },
    { etq: "CLUB", val: input.clubName.trim().toUpperCase() },
    { etq: "CATEGORÍA", val: input.categoriaNombre.trim().toUpperCase() },
  ];

  const lineStep = lddbiCampoRowHeightMm();
  const blockH = campos.reduce(
    (h, c) => h + (c.destacado ? lddbiCampoRowHeightMm(true) : lineStep),
    0,
  );
  let y = bodyTop + (bodyBottom - bodyTop - blockH) / 2;

  campos.forEach(({ etq, val, destacado }) => {
    drawLddbiCampoBlanco(doc, etq, val, datosX, y, datosW, destacado);
    y += destacado ? lddbiCampoRowHeightMm(true) : lineStep;
  });

  drawLddbiFotoConMarco(doc, input.fotoPngDataUrl, fotoX, fotoY, fotoW, fotoH, accent);

  const generoLabel = formatGeneroCarnetEtiqueta(input.gender);
  const num = input.carnetNumber?.trim() || "—";
  const fotoCx = fotoX + fotoW / 2;
  let idY = fotoY + fotoH + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT.fotoLabel);
  doc.setTextColor(210, 230, 245);
  doc.text("CARNET NÚMERO", fotoCx, idY, { align: "center" });
  idY += 2.3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT.fotoNumero);
  doc.setTextColor(255, 255, 255);
  doc.text(num, fotoCx, idY, { align: "center" });
  idY += 2.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LDDBI_FONT.fotoGenero);
  doc.setTextColor(235, 245, 255);
  doc.text(`GÉNERO: ${generoLabel}`, fotoCx, idY, { align: "center" });
  idY += 2.8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT.fotoAnio);
  doc.setTextColor(255, 255, 255);
  doc.text(extractCarnetYear(input.carnetNumber), fotoCx, idY, { align: "center" });

  const bandY = pageH - LDDBI_ACCENT_BAND_MM;
  doc.setFillColor(...accent);
  doc.rect(0, bandY, pageW, LDDBI_ACCENT_BAND_MM, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(LDDBI_FONT.banda);
  doc.setTextColor(255, 255, 255);
  doc.text("CREDENCIAL DEPORTIVA", CARNET_MARGEN_MM + 0.5, bandY + 2.8);
  if (num !== "—") {
    doc.text(`N° ${num}`, pageW - CARNET_MARGEN_MM - 0.5, bandY + 2.6, { align: "right" });
  }
  doc.setTextColor(0);
}
