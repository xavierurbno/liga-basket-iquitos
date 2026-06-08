import { getEntityValidationUrlAction } from "@/lib/actions/validation-url";
import { buildCarnetJugadorPdfInput } from "@/lib/carnet/buildCarnetJugadorPdfInput";
import { buildCarnetPdfImageAssets } from "@/lib/carnet/buildCarnetPdfImageAssets";
import { loadCarnetInstitutionalAssets } from "@/lib/carnet/loadCarnetInstitutionalAssets";
import { generarCarnetJugadorPdf } from "@/lib/pdf/carnetJugadorPdf";
import { extractValidationTokenFromUrl } from "@/lib/validation/extract-validation-token";
import type { GenerateCarnetPDFProps } from "@/lib/types/carnet";

/** Genera el mismo Blob que descarga «Carnet PDF» (WYSIWYG). */
export async function generateCarnetPdfBlob(
  props: GenerateCarnetPDFProps,
): Promise<Blob> {
  const base =
    typeof window !== "undefined" ? window.location.origin : "";

  const validationToken =
    props.validationTokenForPublicAssets?.trim() ||
    extractValidationTokenFromUrl(props.validationUrl);

  const inst = await loadCarnetInstitutionalAssets(
    props.leagueId,
    props.leagueDisplayName?.trim() || "Liga deportiva",
    validationToken ? { validationToken } : undefined,
  );

  let validationUrl = props.validationUrl?.trim() || null;
  if (!validationUrl) {
    const urlRes = await getEntityValidationUrlAction(props.playerId, "player");
    if (urlRes.ok) validationUrl = urlRes.url;
  }

  const assets = await buildCarnetPdfImageAssets({
    photoUrl: props.photoUrl,
    clubLogoUrl: props.clubLogoUrl,
    playerId: props.playerId,
    validationUrl,
    baseOrigin: base,
    ligaLogoPngDataUrl: inst.ligaLogoPngDataUrl,
    ligaLogoMonoPngDataUrl: inst.ligaLogoMonoPngDataUrl,
    federacionLogoPngDataUrl: inst.federacionLogoPngDataUrl,
    federacionLogoMonoPngDataUrl: inst.federacionLogoMonoPngDataUrl,
    sportGraphicPngDataUrl: inst.sportGraphicPngDataUrl,
    presidentSignaturePngDataUrl: inst.presidentSignaturePngDataUrl,
    secretarySignaturePngDataUrl: inst.secretarySignaturePngDataUrl,
  });

  assets.anversoTemplatePngDataUrl = inst.anversoTemplatePngDataUrl;
  assets.reversoTemplatePngDataUrl = inst.reversoTemplatePngDataUrl;

  const input = buildCarnetJugadorPdfInput(
    { ...props, validationUrl },
    assets,
    inst.institucional,
    base,
  );

  return generarCarnetJugadorPdf(input);
}
