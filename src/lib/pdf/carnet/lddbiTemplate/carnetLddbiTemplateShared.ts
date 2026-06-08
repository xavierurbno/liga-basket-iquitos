import type { jsPDF as JsPDFDoc } from "jspdf";
import {
  lddbiHeaderPdfFontPt,
  resolveLddbiEncabezadoLineas,
} from "@/lib/carnet/lddbiEncabezadoText";
import {
  resolveCarnetOverlayColors,
  type CarnetOverlayColors,
} from "@/lib/carnet/carnetOverlayColors";
import {
  resolveFederacionLogoPngForCarnetFace,
  resolveLigaLogoPngForCarnetFace,
} from "@/lib/carnet/carnetLeagueLogos";
import { VALOR_LINE_HEIGHT_FACTOR } from "@/lib/carnet/lddbiTemplateAnversoLayout";
import { LDDBI_TEMPLATE } from "@/lib/carnet/lddbiTemplateLayout";
import { LDDBI_FONT, LDDBI_HEADER_MM } from "@/lib/carnet/lddbiPremiumTheme";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { CARNET_ALTO_MM, CARNET_ANCHO_MM, CARNET_MARGEN_MM } from "@/lib/pdf/carnetLayout";
import { drawLogoCoverAnchored, drawLogoFit } from "@/lib/pdf/pdfInstitucionalCabecera";

const INK: [number, number, number] = [26, 32, 48];
const LABEL_MUTED: [number, number, number] = [92, 102, 116];
const GOLD: [number, number, number] = [201, 162, 39];

/** Dorado reservado al PNG (etiquetas); valores del sistema van en blanco. */
export const LDDBI_TEMPLATE_GOLD_RGB: [number, number, number] = [212, 175, 55];
export const LDDBI_TEMPLATE_WHITE_RGB: [number, number, number] = [255, 255, 255];
/** Alineado con `LDDBI_TEMPLATE.anverso.valorFontPt` (valores sueltos sin línea de etiqueta). */
export const LDDBI_TEMPLATE_VALOR_FONT_PT = LDDBI_TEMPLATE.anverso.valorFontPt;

export type LddbiTemplateValorStyle = "gold-bold" | "white";

export { INK, LDDBI_TEMPLATE };

export function getCarnetOverlayColorsForInput(
  input: Pick<CarnetJugadorPdfInput, "theme" | "accentRgb">,
): CarnetOverlayColors {
  return resolveCarnetOverlayColors(input.theme.preset, input.accentRgb);
}

export function drawLddbiTemplateFullBleed(
  doc: JsPDFDoc,
  templatePng: string | null | undefined,
  pageW: number,
  pageH: number,
): boolean {
  if (!templatePng?.startsWith("data:image")) return false;
  doc.addImage({
    imageData: templatePng,
    format: "PNG",
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
    compression: "NONE",
  });
  return true;
}

/** Placeholder si aún no hay PNG del mockup en public/. */
export function drawLddbiTemplateAnversoFallback(
  doc: JsPDFDoc,
  primary: [number, number, number],
  _accent: [number, number, number],
) {
  const { pageW, pageH } = { pageW: CARNET_ANCHO_MM, pageH: CARNET_ALTO_MM };
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Falta anverso-template.png en public/carnet/lddbi-template/", pageW / 2, pageH / 2, {
    align: "center",
  });
  doc.setTextColor(0);
}

export function drawLddbiTemplateReversoFallback(
  doc: JsPDFDoc,
  primary: [number, number, number],
) {
  const { pageW, pageH } = { pageW: CARNET_ANCHO_MM, pageH: CARNET_ALTO_MM };
  const { headerMm, footerMm } = LDDBI_TEMPLATE.reverso;

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, headerMm, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(0, headerMm, pageW, pageH - headerMm - footerMm, "F");
  doc.setFillColor(...primary);
  doc.rect(0, pageH - footerMm, pageW, footerMm, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.setTextColor(255, 255, 255);
  doc.text("PLANTILLA PNG — coloca reverso-template.png", pageW / 2, headerMm / 2, {
    align: "center",
  });
  doc.setTextColor(0);
}

/** Solo valor (etiquetas ya impresas en el PNG). */
export function drawLddbiTemplateValor(
  doc: JsPDFDoc,
  valor: string,
  x: number,
  y: number,
  maxW: number,
  style: LddbiTemplateValorStyle = "white",
) {
  const gold = style === "gold-bold";
  doc.setFont("helvetica", gold ? "bold" : "normal");
  doc.setFontSize(LDDBI_TEMPLATE_VALOR_FONT_PT);
  doc.setTextColor(...(gold ? LDDBI_TEMPLATE_GOLD_RGB : LDDBI_TEMPLATE_WHITE_RGB));
  const lines = doc.splitTextToSize((valor || "—").toUpperCase(), maxW);
  doc.text(lines, x, y);
}

/**
 * Maquetación en 3 columnas: etiqueta (7.5pt dorado) | «:» | valor (8.5pt blanco).
 * Calibrado para CR80 / Zebra ZC300 @ 300 DPI.
 */
export function drawLddbiTemplateCampoLinea(
  doc: JsPDFDoc,
  etiqueta: string,
  valor: string,
  labelX: number,
  colonX: number,
  valorX: number,
  y: number,
  valorMaxW: number,
  valorFontPt = LDDBI_TEMPLATE.anverso.valorFontPt,
  colors?: CarnetOverlayColors,
): number {
  const A = LDDBI_TEMPLATE.anverso;
  const colonCx = colonX + A.colonCharBoxMm / 2;
  const overlay = colors ?? resolveCarnetOverlayColors("lddbi_template", [13, 148, 136]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(A.labelFontPt);
  doc.setTextColor(...overlay.labelRgb);
  doc.text(etiqueta, labelX, y);
  doc.text(":", colonCx, y, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(valorFontPt);
  doc.setTextColor(...overlay.valueRgb);
  doc.setLineHeightFactor(VALOR_LINE_HEIGHT_FACTOR);
  const lines = doc.splitTextToSize((valor || "—").toUpperCase(), valorMaxW);
  doc.text(lines, valorX, y);
  doc.setTextColor(0);
  return Array.isArray(lines) ? Math.max(1, lines.length) : 1;
}

/** Etiqueta y valor en blanco negrita (fila CARNET NÚMERO). */
export function drawLddbiTemplateCampoBlancoLinea(
  doc: JsPDFDoc,
  etiqueta: string,
  valor: string,
  labelX: number,
  valorX: number,
  y: number,
  valorMaxW: number,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.6);
  doc.setTextColor(255, 255, 255);
  doc.text(`${etiqueta}:`, labelX, y);
  const lines = doc.splitTextToSize((valor || "—").toUpperCase(), valorMaxW);
  doc.setFontSize(5.4);
  doc.text(lines, valorX, y);
  doc.setTextColor(0);
}

/**
 * Cabecera plantilla PNG: logo federación con object-fit contain (evita que se vea
 * gigante si el PNG trae poco margen). Liga anverso: cover anclado; reverso: contain.
 */
export function drawLddbiTemplateEncabezadoAnverso(
  doc: JsPDFDoc,
  input: CarnetJugadorPdfInput,
  face: "anverso" | "reverso" = "anverso",
): void {
  const pageW = doc.internal.pageSize.getWidth();
  const m = CARNET_MARGEN_MM;
  const A = LDDBI_TEMPLATE.anverso;
  const fedBox = A.headerLogoFedMm;
  const leagueBox =
    face === "anverso" ? A.headerLogoLeagueAnversoMm : A.headerLogoLeagueMm;
  const logoYFed = (LDDBI_HEADER_MM - fedBox) / 2;
  const logoYLiga = (LDDBI_HEADER_MM - leagueBox) / 2;
  const encabezado = resolveLddbiEncabezadoLineas(
    input.leagueDisplayName,
    input.theme.federationDisplayName,
    input.theme.showFederation,
    input.leagueSlug,
    input.theme.sportLabel,
  );
  const overlay = getCarnetOverlayColorsForInput(input);

  const fedLogo = resolveFederacionLogoPngForCarnetFace(input, face);
  if (fedLogo) {
    drawLogoFit(doc, fedLogo, m, logoYFed, fedBox, fedBox);
  }

  const ligaLogo = resolveLigaLogoPngForCarnetFace(input, face);
  const leagueX = pageW - m - leagueBox;
  if (ligaLogo) {
    if (face === "anverso") {
      drawLogoCoverAnchored(
        doc,
        ligaLogo,
        leagueX,
        logoYLiga,
        leagueBox,
        leagueBox,
        "top-right",
      );
    } else {
      drawLogoFit(doc, ligaLogo, leagueX, logoYLiga, leagueBox, leagueBox);
    }
  }

  const sideReserve = Math.max(fedBox, leagueBox);
  const centerMaxW = pageW - 2 * (m + sideReserve + 2.5);
  const cx = pageW / 2;
  const fedLineH = encabezado.headerLayout === "single-prominent" ? 3.1 : 2.65;
  const ligaLineH = encabezado.headerLayout === "single-prominent" ? 3.1 : 2.35;

  doc.setFont("helvetica", "bold");
  let fedLines: string[] = [];
  if (encabezado.lineaFederacion != null) {
    doc.setFontSize(lddbiHeaderPdfFontPt(encabezado.headerLayout, "fed"));
    fedLines = doc.splitTextToSize(encabezado.lineaFederacion, centerMaxW);
  }
  doc.setFontSize(lddbiHeaderPdfFontPt(encabezado.headerLayout, "liga"));
  const ligaLines = doc.splitTextToSize(encabezado.lineaLiga, centerMaxW);

  const textBlockH = fedLines.length * fedLineH + ligaLines.length * ligaLineH;
  let y = Math.max(1.8, (LDDBI_HEADER_MM - textBlockH) / 2 + 1.1);

  if (fedLines.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(lddbiHeaderPdfFontPt(encabezado.headerLayout, "fed"));
    doc.setTextColor(...overlay.headerFedRgb);
    for (const line of fedLines) {
      doc.text(line, cx, y, { align: "center" });
      y += fedLineH;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(lddbiHeaderPdfFontPt(encabezado.headerLayout, "liga"));
  doc.setTextColor(
    ...(encabezado.headerLayout === "single-prominent"
      ? overlay.headerFedRgb
      : overlay.headerLigaRgb),
  );
  for (const line of ligaLines) {
    doc.text(line, cx, y, { align: "center" });
    y += ligaLineH;
  }
  doc.setTextColor(0);
}

/**
 * DNI y correlativo bajo la foto: solo números, centrados, bold blanco.
 * Orden: DNI arriba, correlativo debajo.
 */
export function drawLddbiTemplateFotoIdentificacion(
  doc: JsPDFDoc,
  fotoX: number,
  fotoY: number,
  fotoW: number,
  fotoH: number,
  documentNumber: string,
  carnetNumber: string | null | undefined,
  colors?: CarnetOverlayColors,
) {
  const A = LDDBI_TEMPLATE.anverso;
  const { dniYOffsetMm, dniLineHeightMm, correlativoGapBelowDniMm } = A.fotoIdentificacion;
  const cx = fotoX + fotoW / 2;
  const dniY = fotoY + fotoH + dniYOffsetMm;
  const dniVal = (documentNumber ?? "").trim().toUpperCase() || "—";
  const overlay = colors ?? resolveCarnetOverlayColors("lddbi_template", [13, 148, 136]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(A.dniFontPt);
  doc.setTextColor(...overlay.identificacionRgb);
  doc.text(dniVal, cx, dniY, { align: "center" });

  const carnetVal = (carnetNumber ?? "").trim().toUpperCase() || "—";
  const carnetY = dniY + dniLineHeightMm + correlativoGapBelowDniMm;
  doc.setFontSize(carnetVal.length > 14 ? A.carnetFontPtCompact : A.carnetFontPt);
  const lines = doc.splitTextToSize(carnetVal, fotoW + 1.5);
  doc.text(lines, cx, carnetY, { align: "center" });
  doc.setTextColor(0);
}

/** Etiqueta arriba, valor abajo (legacy). */
export function drawLddbiTemplateCampo(
  doc: JsPDFDoc,
  etiqueta: string,
  valor: string,
  x: number,
  y: number,
  maxW: number,
  destacado = false,
  labelOffsetMm = 2.4,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.4);
  doc.setTextColor(...LABEL_MUTED);
  doc.text(`${etiqueta}:`, x, y);

  doc.setFont("helvetica", destacado ? "bold" : "normal");
  doc.setFontSize(destacado ? 5.6 : 5);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize((valor || "—").toUpperCase(), maxW);
  doc.text(lines, x, y + labelOffsetMm);
}

export function drawLddbiTemplateFoto(
  doc: JsPDFDoc,
  foto: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
  borderRgb: [number, number, number],
) {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, h, 1.2, 1.2, "F");
  doc.setDrawColor(...borderRgb);
  doc.setLineWidth(0.45);
  doc.roundedRect(x, y, w, h, 1.2, 1.2, "S");
  doc.setDrawColor(0);

  if (foto?.startsWith("data:image")) {
    drawLogoFit(doc, foto, x + 0.35, y + 0.35, w - 0.7, h - 0.7);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.2);
    doc.setTextColor(140, 148, 160);
    doc.text("SIN FOTO", x + w / 2, y + h / 2 + 0.8, { align: "center" });
  }
  doc.setTextColor(0);
}

export function drawLddbiTemplateLineaPuntos(
  doc: JsPDFDoc,
  x: number,
  y: number,
  w: number,
) {
  doc.setDrawColor(120, 128, 140);
  doc.setLineWidth(0.18);
  const step = 1.1;
  for (let px = x; px < x + w; px += step * 2) {
    doc.line(px, y, Math.min(px + step, x + w), y);
  }
  doc.setDrawColor(0);
}
