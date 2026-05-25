import { buildCarnetJugadorPdfInput } from "@/lib/carnet/buildCarnetJugadorPdfInput";
import { buildCarnetPdfImageAssets } from "@/lib/carnet/buildCarnetPdfImageAssets";
import { loadCarnetInstitutionalAssets } from "@/lib/carnet/loadCarnetInstitutionalAssets";
import { generarCarnetJugadorPdf } from "@/lib/pdf/carnetJugadorPdf";
import type { GenerateCarnetPDFProps } from "@/lib/types/carnet";

/** Genera el mismo Blob que descarga «Carnet PDF» (WYSIWYG). */
export async function generateCarnetPdfBlob(
  props: GenerateCarnetPDFProps,
): Promise<Blob> {
  const base =
    typeof window !== "undefined" ? window.location.origin : "";

  const inst = await loadCarnetInstitutionalAssets(
    props.leagueId,
    props.leagueDisplayName?.trim() || "Liga deportiva",
  );

  const assets = await buildCarnetPdfImageAssets({
    photoUrl: props.photoUrl,
    clubLogoUrl: props.clubLogoUrl,
    playerId: props.playerId,
    baseOrigin: base,
    ligaLogoPngDataUrl: inst.ligaLogoPngDataUrl,
    federacionLogoPngDataUrl: inst.federacionLogoPngDataUrl,
    sportGraphicPngDataUrl: inst.sportGraphicPngDataUrl,
    presidentSignaturePngDataUrl: inst.presidentSignaturePngDataUrl,
    secretarySignaturePngDataUrl: inst.secretarySignaturePngDataUrl,
  });

  if (inst.institucional.theme.preset === "lddbi_template") {
    assets.anversoTemplatePngDataUrl = inst.anversoTemplatePngDataUrl;
    assets.reversoTemplatePngDataUrl = inst.reversoTemplatePngDataUrl;
  }

  const input = buildCarnetJugadorPdfInput(
    props,
    assets,
    inst.institucional,
    base,
  );

  return generarCarnetJugadorPdf(input);
}
