/**
 * ============================================================
 * MOTOR DE DOCUMENTOS INSTITUCIONALES PDF — v3
 * Liga Deportiva Distrital Mixta de Basket de Iquitos
 * ============================================================
 * Tipos: Carta de Pase | Constancia de Jugador | Solvencia Club
 * Engine: jsPDF 4.x · A4 Portrait · unit: mm
 * ============================================================
 */

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { resolveFichaCabeceraLineas } from "@/lib/pdf/fichaInstitucionalTextos";

// ─── TIPOS ────────────────────────────────────────────────────

export type TipoDocumento = "CARTA_PASE" | "CONSTANCIA" | "SOLVENCIA_CLUB";

export type DocumentoInput = {
  type: TipoDocumento;
  /** ID del jugador o club (registro interno). */
  entityId: string;
  /** URL pública de validación (token firmado); si falta, se usa legado con `entityId`. */
  validationUrl?: string | null;
  // ── Jugador (CARTA_PASE / CONSTANCIA) ──
  name?: string;
  lastname?: string;
  documentType?: string;
  documentNumber?: string;
  categoriaNombre?: string;
  fotoPngDataUrl?: string | null;
  fotoRemoteUrl?: string | null;
  // ── Club (presente en todos los tipos) ──
  clubName: string;
  clubCodigoFederacion?: string | null;
  clubPresidente?: string | null;
  // ── Comunes ──
  federacionLogoPngDataUrl: string | null;
  ligaLogoPngDataUrl: string | null;
  siteUrl: string;
  generatedAtIso?: string;
  
  // ── Historial y Serialización ──
  shortIdentifier?: string;
  correlative?: number;
  esCopia?: boolean;
  fechaOriginal?: string;
  /** Liga de la emisión (historial por liga). */
  leagueId?: string | null;
  /** Colores desde `league_settings` (Fase 4/6). */
  brandPrimaryRgb?: [number, number, number];
  brandAccentRgb?: [number, number, number];
  /** Nombre institucional en encabezado y párrafos (multiliga). */
  leagueDisplayName?: string | null;
  /** Etiqueta de temporada en textos (p. ej. «Temporada 2026»). */
  seasonLabel?: string | null;
  showFederation?: boolean;
  leagueSlug?: string | null;
  federationDisplayName?: string | null;
};

// ─── PALETA ───────────────────────────────────────────────────

/** Celeste Eléctrico #3B82F6 — color institucional de la plataforma */
const CELESTE: [number, number, number] = [59, 130, 246];
const NAVY: [number, number, number] = [15, 23, 42];
const BLUE_700: [number, number, number] = [29, 78, 216];
const GOLD: [number, number, number] = [202, 138, 4];
const GRAY_500: [number, number, number] = [107, 114, 128];
const GRAY_300: [number, number, number] = [209, 213, 219];
const WHITE: [number, number, number] = [255, 255, 255];

// ─── MÉTRICAS ─────────────────────────────────────────────────

const MARGIN = 20;
const PAGE_W = 210;
const PAGE_H = 297;
const CX = PAGE_W / 2;
const BAND_H = 7;
const INNER_W = PAGE_W - MARGIN * 2;

// ─── HELPERS IMAGEN ───────────────────────────────────────────

function fmt(d: string): "PNG" | "JPEG" {
  return d.startsWith("data:image/jpeg") || d.startsWith("data:image/jpg")
    ? "JPEG"
    : "PNG";
}

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawLogo(
  doc: jsPDF, dataUrl: string | null,
  x: number, y: number, maxW: number, maxH: number, label = "Logo"
) {
  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    return;
  }
  const f = fmt(dataUrl);
  const p = doc.getImageProperties(dataUrl);
  const ratio = p.width / p.height;
  let w = maxW, h = w / ratio;
  if (h > maxH) { h = maxH; w = h * ratio; }
  doc.addImage({ imageData: dataUrl, format: f, x: x + (maxW - w) / 2, y: y + (maxH - h) / 2, width: w, height: h, compression: "NONE" });
}

function drawWatermark(doc: jsPDF, dataUrl: string | null) {
  if (!dataUrl) return;
  const p = doc.getImageProperties(dataUrl);
  const wmW = 130, wmH = wmW * (p.height / p.width);
  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.07 }));
  doc.addImage({ imageData: dataUrl, format: fmt(dataUrl), x: (PAGE_W - wmW) / 2, y: (PAGE_H - wmH) / 2, width: wmW, height: wmH, compression: "NONE" });
  doc.restoreGraphicsState();
}

function drawSep(doc: jsPDF, y: number) {
  doc.setDrawColor(...GRAY_300); doc.setLineWidth(0.15);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.setDrawColor(0); doc.setLineWidth(0.2);
}

function stripProtocol(url: string) { return url.replace(/^https?:\/\//, ""); }

function fechaPeru(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" }); }
}

async function genQr(url: string): Promise<string | null> {
  try { return await QRCode.toDataURL(url, { width: 140, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }); }
  catch { return null; }
}

// ─── TEXTOS ───────────────────────────────────────────────────

const FALLBACK_LEAGUE_NAME =
  "LIGA DEPORTIVA DISTRITAL MIXTA DE BASKET DE IQUITOS";

function resolveLeagueName(input: DocumentoInput): string {
  const n = input.leagueDisplayName?.trim();
  return n || FALLBACK_LEAGUE_NAME;
}

function resolveSeasonLabel(input: DocumentoInput): string {
  const s = input.seasonLabel?.trim();
  return s || `Temporada ${new Date().getFullYear()}`;
}

function buildTextoJugador(
  type: "CARTA_PASE" | "CONSTANCIA",
  nc: string,
  docType: string,
  docNum: string,
  club: string,
  leagueName: string,
  seasonLabel: string,
) {
  if (type === "CARTA_PASE")
    return `${leagueName} certifica que el deportista ${nc}, con ${docType} ${docNum}, se encuentra en condición de JUGADOR LIBRE respecto al club ${club}. Se expide la presente para facilitar su nueva afiliación deportiva, sin que exista impedimento administrativo o disciplinario en nuestros registros oficiales.`;
  return `Se hace constar que el deportista ${nc}, con ${docType} ${docNum}, figura como JUGADOR ACTIVO de la institución ${club} para la ${seasonLabel}. El deportista se encuentra debidamente habilitado para participar en competiciones oficiales y representar a su club en eventos deportivos dentro y fuera de la región.`;
}

function buildTextoSolvencia(clubName: string, leagueName: string, seasonLabel: string) {
  return `${leagueName} certifica que el Club ${clubName.toUpperCase()}, debidamente inscrito en nuestros registros institucionales, se encuentra APTO Y SOLVENTE para la ${seasonLabel}, sin presentar deudas pendientes, sanciones disciplinarias ni impedimentos administrativos que limiten su participación en las competencias oficiales organizadas por esta institución.`;
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────

export async function generarDocumentoInstitucional(input: DocumentoInput): Promise<Blob> {
  const {
    type, entityId, name, lastname, categoriaNombre,
    fotoPngDataUrl: fotoRaw, fotoRemoteUrl,
    clubName, clubCodigoFederacion, clubPresidente,
    federacionLogoPngDataUrl, ligaLogoPngDataUrl,
    siteUrl, generatedAtIso,
    shortIdentifier, correlative, esCopia, fechaOriginal,
  } = input;

  const generatedAt = generatedAtIso ?? new Date().toISOString();
  const validUrl =
    input.validationUrl?.trim() ||
    `${siteUrl.replace(/\/+$/, "")}/validar/${encodeURIComponent(entityId)}`;
  const esSolvencia = type === "SOLVENCIA_CLUB";
  const leagueName = resolveLeagueName(input);
  const seasonLabel = resolveSeasonLabel(input);
  const cabecera = resolveFichaCabeceraLineas(
    leagueName,
    input.federationDisplayName,
    input.showFederation !== false,
    input.leagueSlug,
  );

  // Resolución de foto (doble capa)
  let fotoDataUrl: string | null = fotoRaw ?? null;
  if (!fotoDataUrl && fotoRemoteUrl) fotoDataUrl = await fetchBase64(fotoRemoteUrl);

  const qrDataUrl = await genQr(validUrl);

  const accentRgb = input.brandAccentRgb ?? CELESTE;
  const primaryRgb = input.brandPrimaryRgb ?? NAVY;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: false });

  // ── 1. MARCA DE AGUA ──────────────────────────────────────
  drawWatermark(doc, ligaLogoPngDataUrl);

  // ── 2. BANDA SUPERIOR (color de acento de la liga) ────────
  doc.setFillColor(...accentRgb);
  doc.rect(0, 0, PAGE_W, BAND_H, "F");

  // ── 3. ENCABEZADO ─────────────────────────────────────────
  const LOGO_W = 28, LOGO_H = 22, HTOP = BAND_H + 4;
  if (input.showFederation !== false && federacionLogoPngDataUrl) {
    drawLogo(doc, federacionLogoPngDataUrl, MARGIN, HTOP, LOGO_W, LOGO_H, "FDPB");
  }
  drawLogo(doc, ligaLogoPngDataUrl, PAGE_W - MARGIN - LOGO_W, HTOP, LOGO_W, LOGO_H, "Liga");

  let hY = HTOP + 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...primaryRgb);
  if (cabecera.lineaFederacion) {
    doc.text(cabecera.lineaFederacion, CX, hY, { align: "center" });
    hY += 6;
  }

  doc.setFontSize(cabecera.lineaFederacion ? 10 : 12);
  doc.setFont("helvetica", cabecera.lineaFederacion ? "normal" : "bold");
  doc.setTextColor(...BLUE_700);
  const leagueHeaderLines = doc.splitTextToSize(cabecera.lineaLiga, INNER_W - 10);
  doc.text(leagueHeaderLines, CX, hY, { align: "center" });
  hY += leagueHeaderLines.length * 4.5;

  hY += 3;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...GOLD);
  const tipoLabel = type === "CARTA_PASE" ? "CARTA DE PASE"
    : type === "CONSTANCIA" ? "CONSTANCIA DE JUGADOR"
    : "CARTA DE NO ADEUDO";
  doc.text(tipoLabel, CX, hY, { align: "center" });
  const SEP_Y = HTOP + LOGO_H + 4;
  drawSep(doc, SEP_Y);

  // ── 4. CUERPO ─────────────────────────────────────────────
  const BODY_TOP = SEP_Y + 7;
  const FOTO_W = 34, FOTO_H = 42;
  const FOTO_X = PAGE_W - MARGIN - FOTO_W;
  const TEXT_W = esSolvencia ? INNER_W : INNER_W - FOTO_W - 6;

  // Fecha original (sin Ref.)
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...GRAY_500);
  doc.text(fechaPeru(esCopia ? fechaOriginal! : generatedAt), MARGIN, BODY_TOP);

  // ── Foto (solo documentos de jugador) ─────────────────────
  if (!esSolvencia) {
    if (fotoDataUrl) {
      const f = fmt(fotoDataUrl);
      const p = doc.getImageProperties(fotoDataUrl);
      const ratio = p.width / p.height;
      let fw = FOTO_W, fh = fw / ratio;
      if (fh > FOTO_H) { fh = FOTO_H; fw = fh * ratio; }
      doc.setDrawColor(...accentRgb); doc.setLineWidth(0.6);
      doc.rect(FOTO_X - 1, BODY_TOP - 1, FOTO_W + 2, FOTO_H + 2);
      doc.addImage({ imageData: fotoDataUrl, format: f, x: FOTO_X + (FOTO_W - fw) / 2, y: BODY_TOP + (FOTO_H - fh) / 2, width: fw, height: fh, compression: "NONE" });
      doc.setFont("helvetica", "bold"); doc.setFontSize(6); doc.setTextColor(...accentRgb);
      doc.text("FOTO OFICIAL", FOTO_X + FOTO_W / 2, BODY_TOP + FOTO_H + 3.5, { align: "center" });
    } else {
      doc.setDrawColor(...GRAY_300); doc.setFillColor(248, 250, 252); doc.setLineWidth(0.3);
      doc.rect(FOTO_X, BODY_TOP, FOTO_W, FOTO_H, "FD");
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...GRAY_500);
      doc.text("SIN FOTO", FOTO_X + FOTO_W / 2, BODY_TOP + FOTO_H / 2 - 2, { align: "center" });
      doc.text("OFICIAL", FOTO_X + FOTO_W / 2, BODY_TOP + FOTO_H / 2 + 3, { align: "center" });
    }
  }

  // ── Texto formal ──────────────────────────────────────────
  let bodyY = BODY_TOP + 8;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...NAVY);
  doc.text("A QUIEN CORRESPONDA:", MARGIN, bodyY);
  bodyY += 8;

  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(25, 25, 25);
  const parrafo = esSolvencia
    ? buildTextoSolvencia(clubName, leagueName, seasonLabel)
    : buildTextoJugador(
        type as "CARTA_PASE" | "CONSTANCIA",
        `${name!.toUpperCase()} ${lastname!.toUpperCase()}`,
        input.documentType || "DNI",
        input.documentNumber || "—",
        clubName.toUpperCase(),
        leagueName,
        seasonLabel,
      );

  const parLines = doc.splitTextToSize(parrafo, TEXT_W);
  doc.text(parLines, MARGIN, bodyY, { lineHeightFactor: 1.65 });
  bodyY += parLines.length * (10 * 1.65 / 2.83) + 10;

  // ── 5. TABLA CENTRADA (transparente, encabezado celeste) ──
  const TABLE_W = 130;
  const TABLE_X = (PAGE_W - TABLE_W) / 2;
  const ROW_H = 7.5;
  const COL_LABEL_W = 44;

  const tableTitle = esSolvencia ? "DATOS INSTITUCIONALES" : "DATOS DEL DEPORTISTA";

  const campos: [string, string][] = esSolvencia
    ? [
        ["NOMBRE DEL CLUB", clubName.toUpperCase()],
        ["CÓD. FEDERACIÓN", clubCodigoFederacion ?? "—"],
        ["PRESIDENTE", clubPresidente ?? "—"],
        ["TEMPORADA", seasonLabel],
        ["CONDICIÓN", "APTO Y SOLVENTE ✓"],
      ]
    : [
        ["NOMBRES Y APELLIDOS", `${lastname!.toUpperCase()}, ${name!.toUpperCase()}`],
        [input.documentType || "DOCUMENTO", input.documentNumber || "—"],
        ["CLUB", clubName.toUpperCase()],
        ["CATEGORÍA", (categoriaNombre ?? "—").toUpperCase()],
      ];

  const TABLE_H = 8 + campos.length * ROW_H + 5;

  // Encabezado celeste
  doc.setFillColor(...accentRgb);
  doc.roundedRect(TABLE_X, bodyY, TABLE_W, 8, 2, 2, "F");
  doc.rect(TABLE_X, bodyY + 5, TABLE_W, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...WHITE);
  doc.text(tableTitle, TABLE_X + TABLE_W / 2, bodyY + 5, { align: "center" });

  // Borde exterior (sin fill → transparente)
  doc.setDrawColor(...accentRgb); doc.setLineWidth(0.35);
  doc.roundedRect(TABLE_X, bodyY, TABLE_W, TABLE_H, 2, 2);

  // Filas
  let rowY = bodyY + 8;
  for (let i = 0; i < campos.length; i++) {
    const [label, value] = campos[i];
    if (i > 0) {
      doc.setDrawColor(...GRAY_300); doc.setLineWidth(0.1);
      doc.line(TABLE_X + 2, rowY, TABLE_X + TABLE_W - 2, rowY);
    }
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...BLUE_700);
    doc.text(`${label}:`, TABLE_X + 5, rowY + ROW_H * 0.65);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(15, 15, 15);
    const vLines = doc.splitTextToSize(value, TABLE_W - COL_LABEL_W - 8);
    doc.text(vLines, TABLE_X + COL_LABEL_W, rowY + ROW_H * 0.65);
    rowY += ROW_H;
  }

  // Párrafo de cierre
  bodyY += TABLE_H + 8;
  const cierre = esSolvencia
    ? "Se expide la presente carta a solicitud del interesado, para los fines institucionales y legales que corresponda."
    : type === "CARTA_PASE"
      ? "Se expide el presente documento a solicitud del interesado, para los fines que estime conveniente."
      : "Se expide la presente constancia a solicitud del interesado, para los fines legales y deportivos que corresponda.";
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(25, 25, 25);
  const cLines = doc.splitTextToSize(cierre, INNER_W);
  doc.text(cLines, MARGIN, bodyY, { lineHeightFactor: 1.5 });

  // ── 6. FIRMA ──────────────────────────────────────────────
  const FIRMA_Y = PAGE_H - 52;
  const FIRMA_W = 65;
  doc.setDrawColor(...primaryRgb); doc.setLineWidth(0.55);
  doc.line(CX - FIRMA_W / 2, FIRMA_Y, CX + FIRMA_W / 2, FIRMA_Y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...primaryRgb);
  doc.text("PRESIDENTE", CX, FIRMA_Y + 6, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRAY_500);
  const firmaLines = doc.splitTextToSize(leagueName, FIRMA_W + 20);
  doc.text(firmaLines, CX, FIRMA_Y + 11.5, { align: "center" });

  // ── 7. QR VALIDACIÓN ──────────────────────────────────────
  const QR_SIZE = 22;
  const QR_X = PAGE_W - MARGIN - QR_SIZE;
  const QR_Y = PAGE_H - BAND_H - 4 - QR_SIZE - 6;
  if (qrDataUrl) {
    doc.addImage({ imageData: qrDataUrl, format: "PNG", x: QR_X, y: QR_Y, width: QR_SIZE, height: QR_SIZE, compression: "NONE" });
    if (shortIdentifier && correlative) {
      const serialText = `LDDBI - ${shortIdentifier} - ${esCopia ? "C" : ""}${correlative}`;
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...GRAY_500);
      doc.text(serialText, QR_X + QR_SIZE / 2, QR_Y + QR_SIZE + 3, { align: "center" });
    } else {
      doc.setFont("helvetica", "normal"); doc.setFontSize(5.5); doc.setTextColor(...GRAY_500);
      doc.text("Escanear para validar", QR_X + QR_SIZE / 2, QR_Y + QR_SIZE + 3, { align: "center" });
    }
  }

  // ── 8. BANDA INFERIOR (Celeste Eléctrico) ─────────────────
  doc.setFillColor(...accentRgb);
  doc.rect(0, PAGE_H - BAND_H, PAGE_W, BAND_H, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(220, 235, 255);
  
  if (esCopia && fechaOriginal) {
    doc.text(
      `Emitido originalmente: ${fechaPeru(fechaOriginal)} | Reimpresión: ${fechaPeru(generatedAt)} | ${stripProtocol(validUrl)}`,
      CX, PAGE_H - 2.5, { align: "center" }
    );
  } else {
    const footerLeague =
      input.leagueDisplayName?.trim() || "Liga deportiva";
    doc.text(
      `${footerLeague} | Generado el: ${fechaPeru(generatedAt)} | ${stripProtocol(validUrl)}`,
      CX, PAGE_H - 2.5, { align: "center" }
    );
  }

  return doc.output("blob");
}
