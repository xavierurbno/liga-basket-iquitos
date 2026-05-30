import { jsPDF } from "jspdf";
import type { jsPDF as JsPDFDoc } from "jspdf";
import {
  LDDBI_TEMPLATE,
  type LddbiTemplateAnversoCampo,
  lddbiTemplateAnversoFieldDefs,
  lddbiTemplateDatosFirstRowYMm,
} from "@/lib/carnet/lddbiTemplateLayout";

export const VALOR_LINE_HEIGHT_FACTOR = 1.15;

/** Altura de una línea de valor en mm (8.5pt bold ≈ 3.4 mm con factor 1.15). */
export function lddbiTemplateValorLineHeightMm(
  fontPt = LDDBI_TEMPLATE.anverso.valorFontPt,
): number {
  return (fontPt / 72) * 25.4 * VALOR_LINE_HEIGHT_FACTOR;
}

/** Cuenta líneas tras partir el valor al ancho de la columna (misma lógica que el PDF). */
export function countLddbiTemplateValorLines(
  doc: JsPDFDoc,
  valor: string,
  maxWMm: number,
  fontPt = LDDBI_TEMPLATE.anverso.valorFontPt,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontPt);
  const lines = doc.splitTextToSize((valor || "—").toUpperCase(), maxWMm);
  if (Array.isArray(lines)) return Math.max(1, lines.length);
  return 1;
}

/**
 * Avance vertical entre filas: mínimo `rowStepMm`; si el valor ocupa varias líneas,
 * crece según altura real (evita que CLUB largo monte sobre CATEGORÍA).
 */
export function lddbiTemplateRowAdvanceMm(lineCount: number): number {
  const A = LDDBI_TEMPLATE.anverso;
  const lines = Math.max(1, lineCount);
  const lineH = lddbiTemplateValorLineHeightMm(A.valorFontPt);
  const blockH = lines * lineH + (lines > 1 ? A.rowMultiLinePadMm : 0);
  return Math.max(A.rowStepMm, blockH);
}

export type LddbiTemplateAnversoCampoLayout = LddbiTemplateAnversoCampo & {
  lineCount: number;
  rowAdvanceMm: number;
};

/** Posiciones Y dinámicas según líneas de cada valor (PDF y vista previa). */
export function layoutLddbiTemplateAnversoCampos(
  doc: JsPDFDoc,
  input: Parameters<typeof lddbiTemplateAnversoFieldDefs>[0],
): LddbiTemplateAnversoCampoLayout[] {
  const A = LDDBI_TEMPLATE.anverso;
  let y = lddbiTemplateDatosFirstRowYMm();

  return lddbiTemplateAnversoFieldDefs(input).map((d) => {
    const lineCount = countLddbiTemplateValorLines(doc, d.val, A.datosMaxW, A.valorFontPt);
    const rowAdvanceMm = lddbiTemplateRowAdvanceMm(lineCount);
    const row: LddbiTemplateAnversoCampoLayout = {
      id: d.id,
      etiqueta: d.etiqueta,
      val: d.val,
      y,
      destacado: d.destacado,
      blancoBold: d.blancoBold,
      lineCount,
      rowAdvanceMm,
    };
    y += rowAdvanceMm;
    return row;
  });
}

/** Documento mínimo solo para medir saltos de línea (vista previa en cliente). */
export function createLddbiTemplateMeasureDoc(): JsPDFDoc {
  return new jsPDF({
    unit: "mm",
    format: [LDDBI_TEMPLATE.pageW, LDDBI_TEMPLATE.pageH],
    compress: true,
  });
}
