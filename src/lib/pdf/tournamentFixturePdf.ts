import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PAGE_X_MARGIN_MM,
  calcCabeceraInstitucionalMetrics,
  drawCabeceraInstitucional,
  drawMarcaAguaCentrada,
} from "@/lib/pdf/pdfInstitucionalCabecera";
import type { TournamentExportPayload } from "@/lib/tournaments/export-types";

/** Logos institucionales (misma fuente que la ficha de inscripción). */
export type TournamentFixturePdfAssets = {
  federacionLogoPngDataUrl: string | null;
  ligaLogoPngDataUrl: string | null;
  showFederation?: boolean;
  leagueSlug?: string | null;
  federationDisplayName?: string | null;
};

/** Encabezado de tabla alineado con la ficha (#2563eb). */
const HEAD_FILL: [number, number, number] = [37, 99, 235];
const SECTION_NAVY: [number, number, number] = [27, 58, 107];
const ROUND_AMBER: [number, number, number] = [245, 166, 35];

type AutoTableDoc = jsPDF & { lastAutoTable: { finalY: number } };

function buildCabeceraInput(
  data: TournamentExportPayload,
  assets: TournamentFixturePdfAssets,
) {
  return {
    federacionLogoPngDataUrl:
      assets.showFederation !== false ? assets.federacionLogoPngDataUrl : null,
    ligaLogoPngDataUrl: assets.ligaLogoPngDataUrl,
    leagueTitleLine: data.leagueName,
    leagueSlug: assets.leagueSlug,
    showFederation: assets.showFederation,
    federationDisplayName: assets.federationDisplayName,
    documentTitle: data.tournamentName.trim(),
    identityLines: [`Formato: ${data.format}`],
    rightLogoPngDataUrl: assets.ligaLogoPngDataUrl,
  };
}

export function downloadTournamentFixturePdf(
  data: TournamentExportPayload,
  assets: TournamentFixturePdfAssets,
  fileName?: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: false });
  const headerTop = PAGE_X_MARGIN_MM;
  const margin = PAGE_X_MARGIN_MM;
  const cabeceraInput = buildCabeceraInput(data, assets);
  const cabeceraMetrics = calcCabeceraInstitucionalMetrics(doc, cabeceraInput);

  drawMarcaAguaCentrada(doc, assets.ligaLogoPngDataUrl);
  drawCabeceraInstitucional(doc, cabeceraInput, headerTop, cabeceraMetrics);

  let y = headerTop + cabeceraMetrics.alturaHastaInicioTabla;

  const newPage = () => {
    doc.addPage();
    drawMarcaAguaCentrada(doc, assets.ligaLogoPngDataUrl);
    y = headerTop + 6;
  };

  for (const group of data.groups) {
    if (y > 250) newPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...SECTION_NAVY);
    doc.text(group.name, margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Equipo"]],
      body: group.standings.map((r) => [r.team]),
      theme: "grid",
      headStyles: {
        fillColor: HEAD_FILL,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
    doc.setTextColor(0, 0, 0);
  }

  for (const round of data.rounds) {
    if (y > 240) newPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ROUND_AMBER);
    doc.text(round.label, margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Partido", "Resultado"]],
      body: round.matches.map((m) => [m.label, m.score]),
      theme: "striped",
      headStyles: {
        fillColor: HEAD_FILL,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    });
    y = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
    doc.setTextColor(0, 0, 0);
  }

  const safeName = (fileName ?? data.tournamentName).replace(/[^\w\s-]/g, "").trim() || "torneo";
  doc.save(`${safeName}-fixture.pdf`);
}
