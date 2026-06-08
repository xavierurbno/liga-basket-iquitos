import "server-only";

import type {
  CarnetInstitutionalAssetsResult,
  CarnetInstitutionalAssetsSuccess,
} from "@/lib/types/carnet";

/** Respuesta pública: sin URLs crudas de configuración (solo raster base64). */
export function sanitizePublicCarnetAssetsResult(
  result: CarnetInstitutionalAssetsSuccess,
): CarnetInstitutionalAssetsSuccess {
  return {
    ...result,
    urls: {
      ligaLogoUrl: null,
      federacionLogoUrl: null,
      presidentSignatureUrl: null,
      secretarySignatureUrl: null,
    },
  };
}

export function toPublicCarnetAssetsResult(
  result: CarnetInstitutionalAssetsResult,
): CarnetInstitutionalAssetsResult {
  if (!result.success) return result;
  return sanitizePublicCarnetAssetsResult(result);
}
