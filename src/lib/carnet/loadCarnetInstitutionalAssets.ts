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
  ligaLogoMonoPngDataUrl: string | null;
  federacionLogoPngDataUrl: string | null;
  federacionLogoMonoPngDataUrl: string | null;
  sportGraphicPngDataUrl: string | null;
  presidentSignaturePngDataUrl: string | null;
  secretarySignaturePngDataUrl: string | null;
  anversoTemplatePngDataUrl: string | null;
  reversoTemplatePngDataUrl: string | null;
};

export type LoadCarnetInstitutionalAssetsOptions = {
  /** `/validar` sin sesión: usa action pública con plantillas y logos de la liga. */
  publicAccess?: boolean;
};

/** Mismos assets institucionales que el botón «Descargar PDF». */
export async function loadCarnetInstitutionalAssets(
  leagueId: string | null | undefined,
  leagueDisplayName: string,
  opts?: LoadCarnetInstitutionalAssetsOptions,
): Promise<CarnetInstitutionalAssetsBundle> {
  const {
    getCarnetInstitutionalAssetsAction,
    getCarnetInstitutionalAssetsPublicAction,
    getInstitutionalLogosAction,
  } = await import("@/lib/actions/assets");

  let ligaLogoPngDataUrl: string | null = null;
  let ligaLogoMonoPngDataUrl: string | null = null;
  let federacionLogoPngDataUrl: string | null = null;
  let federacionLogoMonoPngDataUrl: string | null = null;
  let sportGraphicPngDataUrl: string | null = null;
  let presidentSignaturePngDataUrl: string | null = null;
  let secretarySignaturePngDataUrl: string | null = null;
  let anversoTemplatePngDataUrl: string | null = null;
  let reversoTemplatePngDataUrl: string | null = null;
  let institucional: CarnetInstitucionalInput = fallbackCarnetInstitucionalInput(
    leagueDisplayName.trim() || "Liga deportiva",
  );

  if (leagueId?.trim()) {
    const inst = opts?.publicAccess
      ? await getCarnetInstitutionalAssetsPublicAction(leagueId.trim())
      : await getCarnetInstitutionalAssetsAction(leagueId.trim());
    if (inst.success) {
      ligaLogoPngDataUrl = inst.ligaLogoPngDataUrl;
      ligaLogoMonoPngDataUrl = inst.ligaLogoMonoPngDataUrl ?? null;
      federacionLogoPngDataUrl = inst.federacionLogoPngDataUrl;
      federacionLogoMonoPngDataUrl = inst.federacionLogoMonoPngDataUrl ?? null;
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
    ligaLogoMonoPngDataUrl,
    federacionLogoPngDataUrl,
    federacionLogoMonoPngDataUrl,
    sportGraphicPngDataUrl,
    presidentSignaturePngDataUrl,
    secretarySignaturePngDataUrl,
    anversoTemplatePngDataUrl,
    reversoTemplatePngDataUrl,
  };
}
