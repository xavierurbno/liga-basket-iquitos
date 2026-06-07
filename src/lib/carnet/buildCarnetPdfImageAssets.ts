import QRCode from "qrcode";
import type {
  BuildCarnetPdfImageAssetsParams,
  BuildCarnetPdfImageAssetsResult,
} from "@/lib/types/carnet";
import { LDDBI_DEFAULT_WATERMARK_PUBLIC_PATH } from "@/lib/carnet/lddbiWatermarkPaths";
import {
  escalarFotoCarnetParaImpresion300Dpi,
  escalarLogoParaPdf,
} from "@/lib/pdf/imagenImpresion";

async function fetchUrlToPngDataUrl(
  url: string | null,
  cache: RequestCache = "force-cache",
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors", cache });
    if (!res.ok) return null;
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/**
 * Precarga y escala todas las imágenes del carnet antes de pintar jsPDF.
 * Debe ejecutarse en el cliente (canvas / Image).
 */
export async function buildCarnetPdfImageAssets(
  params: BuildCarnetPdfImageAssetsParams,
): Promise<BuildCarnetPdfImageAssetsResult> {
  const validationUrl = params.validationUrl?.trim() || null;

  const [clubRaw, fotoRaw, presidentRaw, secretaryRaw] = await Promise.all([
    fetchUrlToPngDataUrl(params.clubLogoUrl, "force-cache"),
    params.photoUrl ? fetchUrlToPngDataUrl(params.photoUrl, "force-cache") : null,
    params.presidentSignaturePngDataUrl
      ? Promise.resolve(params.presidentSignaturePngDataUrl)
      : null,
    params.secretarySignaturePngDataUrl
      ? Promise.resolve(params.secretarySignaturePngDataUrl)
      : null,
  ]);

  const defaultWatermarkUrl = params.baseOrigin
    ? `${params.baseOrigin.replace(/\/+$/, "")}${LDDBI_DEFAULT_WATERMARK_PUBLIC_PATH}`
    : null;
  const sportGraphicRaw =
    params.sportGraphicPngDataUrl ??
    (defaultWatermarkUrl ? await fetchUrlToPngDataUrl(defaultWatermarkUrl, "default") : null);

  const [
    ligaLogo,
    ligaLogoMono,
    federacionLogo,
    federacionLogoMono,
    sportGraphic,
    clubLogo,
    fotoCarnet,
    presidentSignature,
    secretarySignature,
    validationQrPngDataUrl,
  ] = await Promise.all([
    params.ligaLogoPngDataUrl
      ? escalarLogoParaPdf(params.ligaLogoPngDataUrl, 600)
      : null,
    params.ligaLogoMonoPngDataUrl
      ? escalarLogoParaPdf(params.ligaLogoMonoPngDataUrl, 600)
      : null,
    params.federacionLogoPngDataUrl
      ? escalarLogoParaPdf(params.federacionLogoPngDataUrl, 400)
      : null,
    params.federacionLogoMonoPngDataUrl
      ? escalarLogoParaPdf(params.federacionLogoMonoPngDataUrl, 400)
      : null,
    sportGraphicRaw ? escalarLogoParaPdf(sportGraphicRaw, 500) : null,
    clubRaw ? escalarLogoParaPdf(clubRaw, 400) : null,
    fotoRaw ? escalarFotoCarnetParaImpresion300Dpi(fotoRaw) : null,
    presidentRaw ? escalarLogoParaPdf(presidentRaw, 500) : null,
    secretaryRaw ? escalarLogoParaPdf(secretaryRaw, 500) : null,
    validationUrl
      ? QRCode.toDataURL(validationUrl, {
          errorCorrectionLevel: "M",
          margin: 0,
          width: 180,
          color: { dark: "#0f172a", light: "#FFFFFF" },
        })
      : null,
  ]);

  return {
    fotoPngDataUrl: fotoCarnet,
    ligaLogoPngDataUrl: ligaLogo,
    ligaLogoMonoPngDataUrl: ligaLogoMono,
    federacionLogoPngDataUrl: federacionLogo,
    federacionLogoMonoPngDataUrl: federacionLogoMono,
    sportGraphicPngDataUrl: sportGraphic,
    clubLogoPngDataUrl: clubLogo,
    presidentSignaturePngDataUrl: presidentSignature,
    secretarySignaturePngDataUrl: secretarySignature,
    validationQrPngDataUrl,
  };
}
