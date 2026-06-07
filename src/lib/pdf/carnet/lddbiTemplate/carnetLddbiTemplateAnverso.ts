import type { jsPDF as JsPDFDoc } from "jspdf";
import { layoutLddbiTemplateAnversoCampos } from "@/lib/carnet/lddbiTemplateAnversoLayout";
import { LDDBI_TEMPLATE, lddbiTemplateFotoY } from "@/lib/carnet/lddbiTemplateLayout";
import type { CarnetJugadorPdfInput } from "@/lib/types/carnet";
import { fmtFechaCarnetPeru } from "@/lib/pdf/carnet/carnetPdfShared";
import { drawLddbiFotoConMarco } from "@/lib/pdf/carnet/lddbi/carnetLddbiShared";
import {
  drawLddbiTemplateAnversoFallback,
  drawLddbiTemplateCampoLinea,
  drawLddbiTemplateEncabezadoAnverso,
  drawLddbiTemplateFotoCarnetNumero,
  drawLddbiTemplateFullBleed,
} from "@/lib/pdf/carnet/lddbiTemplate/carnetLddbiTemplateShared";

export function drawCarnetLddbiTemplateAnverso(
  doc: JsPDFDoc,
  input: CarnetJugadorPdfInput,
): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const A = LDDBI_TEMPLATE.anverso;
  const primary = input.theme.primaryRgb;
  const accent = input.theme.accentRgb;

  const painted = drawLddbiTemplateFullBleed(
    doc,
    input.anversoTemplatePngDataUrl,
    pageW,
    pageH,
  );
  if (!painted) {
    drawLddbiTemplateAnversoFallback(doc, primary, accent);
  }

  drawLddbiTemplateEncabezadoAnverso(doc, input);

  const campos = layoutLddbiTemplateAnversoCampos(doc, {
    apellidoPaterno: input.apellidoPaterno.trim().toUpperCase(),
    apellidoMaterno: input.apellidoMaterno.trim().toUpperCase(),
    nombres: input.name.trim().toUpperCase(),
    fechaNacimiento: fmtFechaCarnetPeru(input.fechaNacimientoIso),
    documentNumber: input.documentNumber.trim().toUpperCase(),
    clubName: input.clubName.trim().toUpperCase(),
    categoriaNombre: input.categoriaNombre.trim().toUpperCase(),
  });

  campos.forEach((campo) => {
    drawLddbiTemplateCampoLinea(
      doc,
      campo.etiqueta,
      campo.val,
      A.labelX,
      A.colonX,
      A.valorX,
      campo.y,
      A.datosMaxW,
      A.valorFontPt,
    );
  });

  const { w: fw, h: fh, x: fx } = A.foto;
  const fy = lddbiTemplateFotoY(pageH);
  drawLddbiFotoConMarco(doc, input.fotoPngDataUrl, fx, fy, fw, fh, accent);

  drawLddbiTemplateFotoCarnetNumero(doc, fx, fy, fw, fh, input.carnetNumber);
}
