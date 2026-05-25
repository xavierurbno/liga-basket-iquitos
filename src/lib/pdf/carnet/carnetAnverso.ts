import type { jsPDF as JsPDFDoc } from "jspdf";
import { extractCarnetYear } from "@/lib/carnet/carnetColors";
import { formatGeneroCarnetEtiqueta } from "@/lib/carnet/carnetInstitucionalText";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import {
  CARNET_ACCENT_BAND_MM,
  CARNET_CAMPO_LINEA_MM,
  CARNET_FOTO_ALTO_MM,
  CARNET_FOTO_ANCHO_MM,
  CARNET_HEADER_ALTO_MM,
  CARNET_MARGEN_MM,
} from "@/lib/pdf/carnetLayout";
import {
  drawCampoCarnetPremium,
  drawCarnetEncabezadoPremium,
  drawCarnetFranjaAcento,
  drawCarnetPremiumFondo,
  drawFotoJugadorCarnet,
  fmtFechaCarnetPeru,
  resolvePaletteForCarnetInput,
} from "@/lib/pdf/carnet/carnetPdfShared";

export function drawCarnetAnverso(doc: JsPDFDoc, input: CarnetJugadorPdfInput): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const palette = resolvePaletteForCarnetInput(input.primaryRgb, input.accentRgb, "anverso");

  drawCarnetPremiumFondo(doc, palette, CARNET_ACCENT_BAND_MM);
  drawCarnetEncabezadoPremium(
    doc,
    input.leagueDisplayName,
    input.ligaLogoPngDataUrl,
    input.theme.showFederation ? input.federacionLogoPngDataUrl : null,
    palette,
  );

  const bodyTop = CARNET_HEADER_ALTO_MM + 1.4;
  const bodyBottom = pageH - CARNET_MARGEN_MM - CARNET_ACCENT_BAND_MM;
  const bodyH = bodyBottom - bodyTop;
  const bodyCenterY = bodyTop + bodyH / 2;

  const fotoW = CARNET_FOTO_ANCHO_MM + 1;
  const fotoH = CARNET_FOTO_ALTO_MM + 1;
  const idBlockH = fotoH + 1.4 + 6.2;
  const fotoX = CARNET_MARGEN_MM + 0.6;
  const fotoY = bodyCenterY - idBlockH / 2;

  drawFotoJugadorCarnet(doc, input.fotoPngDataUrl, fotoX, fotoY, fotoW, fotoH, palette);

  const idY = fotoY + fotoH + 1.4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(...palette.inkRgb);
  doc.text(`DNI: ${input.documentNumber.trim()}`, fotoX, idY);

  doc.setFontSize(7.2);
  doc.text(extractCarnetYear(input.carnetNumber), fotoX + fotoW / 2, idY + 4, {
    align: "center",
  });

  const datosX = fotoX + fotoW + 2.2;
  const datosW = pageW - datosX - CARNET_MARGEN_MM - 0.6;
  const padX = 1.2;

  const campos: [string, string][] = [
    ["APELLIDO P.", input.apellidoPaterno],
    ["APELLIDO M.", input.apellidoMaterno],
    ["NOMBRE", input.name.trim().toUpperCase()],
    ["F. DE NAC.", fmtFechaCarnetPeru(input.fechaNacimientoIso)],
    ["CLUB", input.clubName.trim().toUpperCase()],
    ["CATEGORÍA", input.categoriaNombre.trim().toUpperCase()],
    ["GÉNERO", formatGeneroCarnetEtiqueta(input.gender)],
  ];

  const datosBlockH = campos.length * CARNET_CAMPO_LINEA_MM;
  const datosStartY = bodyCenterY - datosBlockH / 2 + CARNET_CAMPO_LINEA_MM * 0.5;

  campos.forEach(([etq, val], i) => {
    drawCampoCarnetPremium(
      doc,
      etq,
      val,
      datosX + padX,
      datosStartY + i * CARNET_CAMPO_LINEA_MM,
      datosW - padX * 2,
      palette,
    );
  });

  const carnetLabel = input.carnetNumber?.trim() ? `N° ${input.carnetNumber.trim()}` : "";
  drawCarnetFranjaAcento(doc, palette, "CREDENCIAL DEPORTIVA", carnetLabel);

  doc.setTextColor(0);
}
