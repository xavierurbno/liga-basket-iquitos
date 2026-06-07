import {
  createLddbiTemplateMeasureDoc,
  layoutLddbiTemplateAnversoCampos,
} from "@/lib/carnet/lddbiTemplateAnversoLayout";
import { CARNET_ALTO_MM, CARNET_ANCHO_MM, CARNET_MARGEN_MM } from "@/lib/pdf/carnetLayout";
import { LDDBI_HEADER_MM, LDDBI_HEADER_LOGO_MM } from "@/lib/carnet/lddbiPremiumTheme";

/** Dimensiones del mockup en `public/carnet/lddbi-template/`. */
export const LDDBI_TEMPLATE_PNG_WIDTH_PX = 1011;
export const LDDBI_TEMPLATE_PNG_HEIGHT_PX = 638;

export const LDDBI_TEMPLATE_ASPECT_CSS = `${LDDBI_TEMPLATE_PNG_WIDTH_PX} / ${LDDBI_TEMPLATE_PNG_HEIGHT_PX}`;

export const LDDBI_TEMPLATE_GOLD_HEX = "#c9a227";
export const LDDBI_TEMPLATE_WHITE_HEX = "#ffffff";

export type LddbiTemplateAnversoCampo = {
  id: string;
  etiqueta: string;
  val: string;
  y: number;
  destacado?: boolean;
  /** Etiqueta y valor en blanco negrita (ej. CARNET NÚMERO). */
  blancoBold?: boolean;
};

const LDDBI_TEMPLATE_FOTO_W_MM = 21;
const LDDBI_TEMPLATE_FOTO_X_MM =
  CARNET_ANCHO_MM - CARNET_MARGEN_MM - LDDBI_TEMPLATE_FOTO_W_MM;
/** Separación entre el borde derecho del texto de datos y el marco de la foto. */
const LDDBI_TEMPLATE_DATOS_FOTO_GAP_MM = 3.2;

/**
 * Columna 1: ancho fijo para la etiqueta más larga del set actual.
 * Set: «APELLIDO P.», «APELLIDO M.», «NOMBRES», «F. DE NAC.», «CLUB», «CATEGORÍA».
 * 7.5pt bold Helvetica · «APELLIDO M.» (11 chars) ≈ 17 mm. Se reserva 23 mm.
 */
const LDDBI_TEMPLATE_LABEL_TAB_STOP_MM = 23;
/** Tab 1: hueco etiqueta → «:» (despega el carácter de la etiqueta). */
const LDDBI_TEMPLATE_TAB_LABEL_COLON_MM = 2.6;
/** Casilla del carácter «:» (columna 2, dimensionada para ~7.5–8.5pt). */
const LDDBI_TEMPLATE_COLON_CHAR_BOX_MM = 1.5;
/** Tab 2: hueco «:» → valor (margen común de datos). */
const LDDBI_TEMPLATE_TAB_COLON_VALOR_MM = 2;

const LDDBI_TEMPLATE_DATOS_LABEL_X_MM = CARNET_MARGEN_MM + 1.2;
const LDDBI_TEMPLATE_DATOS_COLON_X_MM =
  LDDBI_TEMPLATE_DATOS_LABEL_X_MM +
  LDDBI_TEMPLATE_LABEL_TAB_STOP_MM +
  LDDBI_TEMPLATE_TAB_LABEL_COLON_MM;
const LDDBI_TEMPLATE_DATOS_VALOR_X_MM =
  LDDBI_TEMPLATE_DATOS_COLON_X_MM +
  LDDBI_TEMPLATE_COLON_CHAR_BOX_MM +
  LDDBI_TEMPLATE_TAB_COLON_VALOR_MM;

const LDDBI_TEMPLATE_REV_QR_SIZE_MM = 10.8;
const LDDBI_TEMPLATE_REV_QR_X_MM =
  CARNET_ANCHO_MM - CARNET_MARGEN_MM - LDDBI_TEMPLATE_REV_QR_SIZE_MM;
/** Sube el QR respecto al borde inferior (la vigencia no se mueve). */
const LDDBI_TEMPLATE_REV_QR_LIFT_MM = 2.5;
const LDDBI_TEMPLATE_REV_QR_Y_MM =
  CARNET_ALTO_MM -
  CARNET_MARGEN_MM -
  LDDBI_TEMPLATE_REV_QR_SIZE_MM -
  LDDBI_TEMPLATE_REV_QR_LIFT_MM;
/** Esquina inferior izquierda: baseline cerca del borde, sin solapar firmas ni QR. */
const LDDBI_TEMPLATE_REV_PIE_VIGENCIA_Y_MM = CARNET_ALTO_MM - CARNET_MARGEN_MM - 1.2;
const LDDBI_TEMPLATE_REV_PIE_VIGENCIA_MAX_W_MM =
  LDDBI_TEMPLATE_REV_QR_X_MM - CARNET_MARGEN_MM - 2.5;
/** Ancho útil para las dos columnas de firmas (sin invadir el QR). */
const LDDBI_TEMPLATE_REV_FIRMAS_ZONE_W_MM =
  LDDBI_TEMPLATE_REV_QR_X_MM - CARNET_MARGEN_MM - 2;
const LDDBI_TEMPLATE_REV_FIRMAS_GAP_MM = 5;
const LDDBI_TEMPLATE_REV_FIRMA_COL_W_MM =
  (LDDBI_TEMPLATE_REV_FIRMAS_ZONE_W_MM - LDDBI_TEMPLATE_REV_FIRMAS_GAP_MM) / 2;

export const LDDBI_TEMPLATE = {
  pageW: CARNET_ANCHO_MM,
  pageH: CARNET_ALTO_MM,
  anverso: {
    /** Zona superior del PNG para logos + textos institucionales (sin franja extra). */
    headerMm: LDDBI_HEADER_MM,
    footerMm: 0,
    headerLogoFedMm: LDDBI_HEADER_LOGO_MM,
    /** Liga un poco mayor (contain/cover) para equilibrar con el logo de federación. */
    headerLogoLeagueMm: 12,
    margenMm: CARNET_MARGEN_MM,
    /**
     * Tres columnas / dos tabulaciones (PDF y vista previa):
     * [etiquetas] --tab1-- [:] --tab2-- [valores]
     */
    labelX: LDDBI_TEMPLATE_DATOS_LABEL_X_MM,
    labelTabStopMm: LDDBI_TEMPLATE_LABEL_TAB_STOP_MM,
    tabLabelColonMm: LDDBI_TEMPLATE_TAB_LABEL_COLON_MM,
    colonX: LDDBI_TEMPLATE_DATOS_COLON_X_MM,
    colonCharBoxMm: LDDBI_TEMPLATE_COLON_CHAR_BOX_MM,
    tabColonValorMm: LDDBI_TEMPLATE_TAB_COLON_VALOR_MM,
    valorX: LDDBI_TEMPLATE_DATOS_VALOR_X_MM,
    /**
     * Aire entre el borde inferior de la cabecera (logos + «LIGA…») y APELLIDOS.
     * Buena práctica CR80: 3–4 mm entre bloque institucional y datos personales.
     */
    datosGapBelowHeaderMm: 3.4,
    datosFotoGapMm: LDDBI_TEMPLATE_DATOS_FOTO_GAP_MM,
    datosMaxW:
      LDDBI_TEMPLATE_FOTO_X_MM -
      LDDBI_TEMPLATE_DATOS_VALOR_X_MM -
      LDDBI_TEMPLATE_DATOS_FOTO_GAP_MM,
    /**
     * 6 filas (apellido P. + M. + 4 más). 4.8 mm ≈ cap 8.5pt bold + aire (CR80 / Zebra ZC300 @ 300 DPI).
     */
    rowStepMm: 4.8,
    /** Aire extra cuando el valor del campo ocupa más de una línea. */
    rowMultiLinePadMm: 0.4,
    /** Tipografía anverso — impresión ZC300 (dye-sub); jerarquía por tamaño + dorado/blanco. */
    labelFontPt: 7.5,
    valorFontPt: 8.5,
    /** DNI bajo la foto (solo número, sin etiqueta). */
    dniFontPt: 8,
    /** Correlativo debajo del DNI (mín. 6.5pt si es largo). */
    carnetFontPt: 7,
    carnetFontPtCompact: 6.5,
    labelFontHeightMm: 2.1,
    valorFontHeightMm: 2.35,
    dniFontHeightMm: 2.2,
    carnetFontHeightMm: 2.0,
    previewCapHeightMm: 2.35,
    /** Marco foto (drawLddbiFotoConMarco): borde accent ~1,1 mm fuera del recuadro blanco. */
    fotoBorderMm: 1.1,
    foto: {
      w: LDDBI_TEMPLATE_FOTO_W_MM,
      h: 25,
      x: LDDBI_TEMPLATE_FOTO_X_MM,
      /** Borde superior del marco alineado bajo la cabecera del PNG. */
      y: LDDBI_HEADER_MM + 2.4,
    },
    /** DNI y correlativo bajo la foto (sin etiquetas). */
    fotoIdentificacion: {
      /** Baseline del DNI respecto al borde inferior de la foto. */
      dniYOffsetMm: 3.8,
      /** Altura reservada del bloque DNI (8pt bold) desde su baseline. */
      dniLineHeightMm: 2.65,
      /** Aire visual entre el bloque DNI y el correlativo. */
      correlativoGapBelowDniMm: 2.0,
    },
  },
  reverso: {
    headerMm: LDDBI_HEADER_MM,
    footerMm: 0,
    headerLogoFedMm: LDDBI_HEADER_LOGO_MM,
    headerLogoLeagueMm: 12,
    qr: {
      x: LDDBI_TEMPLATE_REV_QR_X_MM,
      y: LDDBI_TEMPLATE_REV_QR_Y_MM,
      size: LDDBI_TEMPLATE_REV_QR_SIZE_MM,
    },
    /**
     * Cuerpo legal — 7pt normal (CR80 / ZC300 @ 300 DPI; mín. legible ~7pt).
     * Interlineado 1.35 ≈ 3.6 mm entre líneas centradas.
     */
    legal: {
      offsetBelowHeaderMm: 3.5,
      y: LDDBI_HEADER_MM + 3.5,
      maxW: 81,
      fontSizePt: 7,
      lineHeightMm: 3.6,
      previewFontHeightMm: 2,
    },
    /**
     * Dos columnas de firma (ancho auto hasta el QR). Nombre 7pt con salto de línea;
     * vigencia más pequeña abajo para no competir con los nombres.
     */
    firmas: {
      /** ~2.5 mm más arriba que antes; vigencia sin cambio. */
      y: 31.5,
      x: CARNET_MARGEN_MM,
      w: LDDBI_TEMPLATE_REV_FIRMA_COL_W_MM,
      gap: LDDBI_TEMPLATE_REV_FIRMAS_GAP_MM,
      zoneW: LDDBI_TEMPLATE_REV_FIRMAS_ZONE_W_MM,
      nombreFontPt: 7,
      cargoFontPt: 6,
      nombreLineHeightMm: 2.35,
      gapNombreCargoMm: 1.4,
      nombreFontHeightMm: 1.95,
      cargoFontHeightMm: 1.75,
    },
    /** Vigencia: pie inferior izquierdo, 6pt normal (jerarquía por debajo de firmantes). */
    pieVigencia: {
      x: CARNET_MARGEN_MM,
      y: LDDBI_TEMPLATE_REV_PIE_VIGENCIA_Y_MM,
      maxW: LDDBI_TEMPLATE_REV_PIE_VIGENCIA_MAX_W_MM,
      fontSizePt: 6,
      fontHeightMm: 1.75,
    },
  },
} as const;

/** Borde superior del marco de foto (incluye borde accent). */
export function lddbiTemplateFotoFrameTopMm(_pageH: number = LDDBI_TEMPLATE.pageH): number {
  const A = LDDBI_TEMPLATE.anverso;
  return A.foto.y - A.fotoBorderMm;
}

export function lddbiTemplateFotoY(_pageH: number = LDDBI_TEMPLATE.pageH): number {
  return LDDBI_TEMPLATE.anverso.foto.y;
}

/** Distancia desde el borde inferior de la foto al inicio del correlativo (preview/PDF). */
export function lddbiTemplateCorrelativoOffsetFromPhotoBottomMm(): number {
  const id = LDDBI_TEMPLATE.anverso.fotoIdentificacion;
  return id.dniYOffsetMm + id.dniLineHeightMm + id.correlativoGapBelowDniMm;
}

/** Borde superior del recuadro del logo de federación (cabecera). */
export function lddbiTemplateFedLogoTopMm(): number {
  const A = LDDBI_TEMPLATE.anverso;
  return (A.headerMm - A.headerLogoFedMm) / 2;
}

/** Borde inferior del recuadro del logo de federación. */
export function lddbiTemplateFedLogoBottomMm(): number {
  const A = LDDBI_TEMPLATE.anverso;
  return lddbiTemplateFedLogoTopMm() + A.headerLogoFedMm;
}

/** Primera línea base de APELLIDO P., debajo de la cabecera institucional completa. */
export function lddbiTemplateDatosFirstRowYMm(): number {
  const A = LDDBI_TEMPLATE.anverso;
  return A.headerMm + A.datosGapBelowHeaderMm + A.labelFontHeightMm;
}

export type LddbiTemplateAnversoFieldInput = {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  fechaNacimiento: string;
  clubName: string;
  categoriaNombre: string;
};

export type LddbiTemplateAnversoFieldDef = {
  id: string;
  etiqueta: string;
  val: string;
  destacado?: boolean;
  blancoBold?: boolean;
};

/**
 * Definición de las 6 filas del anverso (sin posición Y).
 * APELLIDO P. y M. en filas separadas para legibilidad en columna estrecha.
 */
export function lddbiTemplateAnversoFieldDefs(
  input: LddbiTemplateAnversoFieldInput,
): LddbiTemplateAnversoFieldDef[] {
  return [
    { id: "apellidoP", etiqueta: "APELLIDO P.", val: input.apellidoPaterno },
    { id: "apellidoM", etiqueta: "APELLIDO M.", val: input.apellidoMaterno },
    { id: "nombres", etiqueta: "NOMBRES", val: input.nombres },
    { id: "fnac", etiqueta: "F. DE NAC.", val: input.fechaNacimiento },
    { id: "club", etiqueta: "CLUB", val: input.clubName },
    { id: "categoria", etiqueta: "CATEGORÍA", val: input.categoriaNombre },
  ];
}

/**
 * Filas con Y fijo (legacy). Preferir `layoutLddbiTemplateAnversoCampos` para PDF/preview.
 */
export function buildLddbiTemplateAnversoCampos(
  input: LddbiTemplateAnversoFieldInput,
): LddbiTemplateAnversoCampo[] {
  const doc = createLddbiTemplateMeasureDoc();
  return layoutLddbiTemplateAnversoCampos(doc, input);
}

export function isLddbiCarnetPreset(preset: string | null | undefined): boolean {
  return preset === "lddbi_bold" || preset === "lddbi_template";
}

export function isLddbiTemplateCarnetPreset(preset: string | null | undefined): boolean {
  return preset === "lddbi_template";
}
