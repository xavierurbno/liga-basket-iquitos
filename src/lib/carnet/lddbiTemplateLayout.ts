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
 * 10pt bold Helvetica · «APELLIDO M.» (11 chars) ≈ 22 mm. Se reserva 23 mm.
 */
const LDDBI_TEMPLATE_LABEL_TAB_STOP_MM = 23;
/** Tab 1: hueco etiqueta → «:» (despega el carácter de la etiqueta). */
const LDDBI_TEMPLATE_TAB_LABEL_COLON_MM = 2.6;
/** Casilla del carácter «:» (columna 2, dimensionada para 10pt). */
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
const LDDBI_TEMPLATE_REV_QR_Y_MM =
  CARNET_ALTO_MM - CARNET_MARGEN_MM - LDDBI_TEMPLATE_REV_QR_SIZE_MM;
const LDDBI_TEMPLATE_REV_PIE_VIGENCIA_Y_MM = CARNET_ALTO_MM - CARNET_MARGEN_MM - 2;

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
     * 6 filas (apellido P. + M. + 4 más) → step tighter para no invadir la zona
     * inferior. 5.5 mm da ~2.8 mm de aire interlínea con cap de 11pt bold.
     */
    rowStepMm: 5.5,
    /** Tipografía PDF anverso (Helvetica no tiene semibold; bold + tamaño/color). */
    labelFontPt: 10,
    valorFontPt: 11,
    /**
     * DNI bajo la foto, sin etiqueta. 10pt bold mantiene la jerarquía:
     * los datos del jugador (11pt) son el hero, el DNI queda en segundo plano.
     */
    dniFontPt: 10,
    labelFontHeightMm: 2.5,
    valorFontHeightMm: 2.8,
    previewCapHeightMm: 2.8,
    /** Marco foto (drawLddbiFotoConMarco): borde accent ~1,1 mm fuera del recuadro blanco. */
    fotoBorderMm: 1.1,
    foto: {
      w: LDDBI_TEMPLATE_FOTO_W_MM,
      h: 25,
      x: LDDBI_TEMPLATE_FOTO_X_MM,
      /** Borde superior del marco alineado bajo la cabecera del PNG. */
      y: LDDBI_HEADER_MM + 2.4,
    },
    /** DNI bajo la foto: solo el número, sin etiqueta. */
    fotoIdentificacion: {
      offsetBelowFotoMm: 2.4,
      lineGapMm: 2.2,
      /** Distancia del borde inferior de la foto al baseline del DNI. */
      dniYOffsetMm: 4.8,
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
     * Cuerpo legal a 8pt con interlineado 1.4 (~4 mm). Ligera reducción vs 9.5pt
     * para que las 5 líneas no choquen con el bloque de firmas y respiren bien.
     */
    legal: {
      offsetBelowHeaderMm: 3.5,
      y: LDDBI_HEADER_MM + 3.5,
      /** Casi todo el ancho útil de la tarjeta menos los márgenes. */
      maxW: 81,
      fontSizePt: 8,
      /** 8pt × 1.4 ≈ 11.2pt → 4 mm. */
      lineHeightMm: 4,
    },
    /**
     * Firmas: cuerpo más pequeño que el legal central para mantener jerarquía
     * (nombre 75 % del legal · cargo 83 % del nombre). Ancho 30 mm × 2 + gap 4
     * para no invadir el área del QR derecho.
     */
    firmas: {
      y: 36,
      w: 30,
      gap: 4,
      nombreFontPt: 6,
      cargoFontPt: 5,
      gapNombreCargoMm: 2.2,
    },
    /** Vigencia: pie izquierdo, tamaño original (compacto). */
    pieVigencia: {
      x: CARNET_MARGEN_MM,
      y: LDDBI_TEMPLATE_REV_PIE_VIGENCIA_Y_MM,
      fontSizePt: 4,
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

/**
 * Filas de datos del anverso (6 filas: APELLIDO P., APELLIDO M., NOMBRES,
 * F. DE NAC., CLUB, CATEGORÍA). Los apellidos van en filas separadas para
 * dar buena legibilidad sin desbordar la columna estrecha junto a la foto.
 */
export function buildLddbiTemplateAnversoCampos(input: {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  fechaNacimiento: string;
  clubName: string;
  categoriaNombre: string;
}): LddbiTemplateAnversoCampo[] {
  const A = LDDBI_TEMPLATE.anverso;

  const defs: {
    id: string;
    etiqueta: string;
    val: string;
    destacado?: boolean;
    blancoBold?: boolean;
  }[] = [
    { id: "apellidoP", etiqueta: "APELLIDO P.", val: input.apellidoPaterno },
    { id: "apellidoM", etiqueta: "APELLIDO M.", val: input.apellidoMaterno },
    { id: "nombres", etiqueta: "NOMBRES", val: input.nombres },
    { id: "fnac", etiqueta: "F. DE NAC.", val: input.fechaNacimiento },
    { id: "club", etiqueta: "CLUB", val: input.clubName },
    { id: "categoria", etiqueta: "CATEGORÍA", val: input.categoriaNombre },
  ];

  let y = lddbiTemplateDatosFirstRowYMm();

  return defs.map((d) => {
    const row: LddbiTemplateAnversoCampo = {
      id: d.id,
      etiqueta: d.etiqueta,
      val: d.val,
      y,
      destacado: d.destacado,
      blancoBold: d.blancoBold,
    };
    y += A.rowStepMm;
    return row;
  });
}

export function isLddbiCarnetPreset(preset: string | null | undefined): boolean {
  return preset === "lddbi_bold" || preset === "lddbi_template";
}

export function isLddbiTemplateCarnetPreset(preset: string | null | undefined): boolean {
  return preset === "lddbi_template";
}
