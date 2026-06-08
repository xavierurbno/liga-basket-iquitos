import type { DocumentoInput, TipoDocumento } from "@/lib/pdf/documentosInstitucionalesPdf";
import { isSignedValidationUrl } from "@/lib/validation/is-signed-validation-url";

const PLAYER_DOC_TYPES = new Set<TipoDocumento>(["CARTA_PASE", "CONSTANCIA"]);

export type DocumentValidationUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string }
  | { ok: true; url: null; skipQr: true };

/**
 * URL de validación para QR en PDF institucional.
 * Jugador: exige token firmado (sin fallback UUID).
 * Solvencia club: sin QR si no hay URL (no hay /validar de club aún).
 */
export function resolveDocumentValidationUrl(
  input: Pick<DocumentoInput, "type" | "validationUrl">,
): DocumentValidationUrlResult {
  const url = input.validationUrl?.trim() || null;

  if (PLAYER_DOC_TYPES.has(input.type)) {
    if (!url || !isSignedValidationUrl(url)) {
      return {
        ok: false,
        error:
          "Enlace de validación inválido o desactualizado. Vuelve a emitir el documento con QR firmado.",
      };
    }
    return { ok: true, url };
  }

  if (!url) {
    return { ok: true, url: null, skipQr: true };
  }

  return { ok: true, url };
}
