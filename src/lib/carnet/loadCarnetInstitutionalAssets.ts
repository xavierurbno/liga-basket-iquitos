import {
  fallbackCarnetInstitucionalInput,
} from "@/lib/carnet/buildCarnetJugadorPdfInput";
import {
  DEFAULT_PDF_ACCENT_RGB,
  DEFAULT_PDF_PRIMARY_RGB,
} from "@/lib/pdf/brand-colors";
import type { CarnetInstitucionalInput } from "@/lib/types/carnet";

export type CarnetInstitutionalAssetsBundle = {
  institucional: CarnetInstitucionalInput;
  ligaLogoPngDataUrl: string | null;
  federacionLogoPngDataUrl: string | null;
  sportGraphicPngDataUrl: string | null;
  presidentSignaturePngDataUrl: string | null;
  secretarySignaturePngDataUrl: string | null;
  anversoTemplatePngDataUrl: string | null;
  reversoTemplatePngDataUrl: string | null;
};

/** Mismos assets institucionales que el botón «Descargar PDF». */
export async function loadCarnetInstitutionalAssets(
  leagueId: string | null | undefined,
  leagueDisplayName: string,
): Promise<CarnetInstitutionalAssetsBundle> {
  const { getCarnetInstitutionalAssetsAction, getInstitutionalLogosAction } =
    await import("@/lib/actions/assets");

  let ligaLogoPngDataUrl: string | null = null;
  let federacionLogoPngDataUrl: string | null = null;
  let sportGraphicPngDataUrl: string | null = null;
  let presidentSignaturePngDataUrl: string | null = null;
  let secretarySignaturePngDataUrl: string | null = null;
  let anversoTemplatePngDataUrl: string | null = null;
  let reversoTemplatePngDataUrl: string | null = null;
  let institucional: CarnetInstitucionalInput = fallbackCarnetInstitucionalInput(
    leagueDisplayName.trim() || "Liga deportiva",
  );

  if (leagueId?.trim()) {
    const inst = await getCarnetInstitutionalAssetsAction(leagueId.trim());
    if (inst.success) {
      ligaLogoPngDataUrl = inst.ligaLogoPngDataUrl;
      federacionLogoPngDataUrl = inst.federacionLogoPngDataUrl;
      sportGraphicPngDataUrl = inst.sportGraphicPngDataUrl;
      presidentSignaturePngDataUrl = inst.presidentSignaturePngDataUrl;
      secretarySignaturePngDataUrl = inst.secretarySignaturePngDataUrl;
      anversoTemplatePngDataUrl = inst.anversoTemplatePngDataUrl ?? null;
      reversoTemplatePngDataUrl = inst.reversoTemplatePngDataUrl ?? null;
      institucional = inst.context;
    } else {
      const logosRes = await getInstitutionalLogosAction(leagueId);
      if (logosRes.success) {
        ligaLogoPngDataUrl = logosRes.ligaBase64;
        federacionLogoPngDataUrl = logosRes.federacionBase64;
        institucional = {
          ...institucional,
          leagueDisplayName:
            leagueDisplayName.trim() || logosRes.leagueDisplayName,
          primaryRgb: logosRes.primaryRgb,
          accentRgb: logosRes.accentRgb,
        };
      }
    }
  } else {
    const logosRes = await getInstitutionalLogosAction(null);
    if (logosRes.success) {
      ligaLogoPngDataUrl = logosRes.ligaBase64;
      federacionLogoPngDataUrl = logosRes.federacionBase64;
      institucional = {
        ...institucional,
        leagueDisplayName:
          leagueDisplayName.trim() || logosRes.leagueDisplayName,
        primaryRgb: logosRes.primaryRgb ?? DEFAULT_PDF_PRIMARY_RGB,
        accentRgb: logosRes.accentRgb ?? DEFAULT_PDF_ACCENT_RGB,
      };
    }
  }

  return {
    institucional,
    ligaLogoPngDataUrl,
    federacionLogoPngDataUrl,
    sportGraphicPngDataUrl,
    presidentSignaturePngDataUrl,
    secretarySignaturePngDataUrl,
    anversoTemplatePngDataUrl,
    reversoTemplatePngDataUrl,
  };
}
