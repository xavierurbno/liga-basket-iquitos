import type { DocumentoInput } from "@/lib/pdf/documentosInstitucionalesPdf";

/** Campos institucionales permitidos en `document_history.snapshot` (sin PII de jugador). */
const SAFE_SNAPSHOT_KEYS = new Set([
  "type",
  "entityId",
  "shortIdentifier",
  "clubName",
  "clubCodigoFederacion",
  "clubPresidente",
  "leagueId",
  "leagueSlug",
  "leagueDisplayName",
  "seasonLabel",
  "federationDisplayName",
  "correlative",
  "generatedAtIso",
  "esCopia",
  "fechaOriginal",
  "documentSerialPrefix",
  "showFederation",
  "siteUrl",
]);

/**
 * Reduce el snapshot persistido: sin nombres, DNI, fotos ni URLs de validación con token.
 */
export function sanitizeDocumentHistorySnapshot(
  input: DocumentoInput & { shortIdentifier?: string },
): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!SAFE_SNAPSHOT_KEYS.has(key)) continue;
    if (value === undefined || value === null) continue;
    clean[key] = value;
  }
  return clean;
}

/** Snapshot mínimo tras ejercicio ARCO de cancelación sobre un jugador. */
export function anonymizedDocumentHistorySnapshot(
  existing: Record<string, unknown>,
): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of SAFE_SNAPSHOT_KEYS) {
    if (existing[key] !== undefined && existing[key] !== null) {
      clean[key] = existing[key];
    }
  }
  clean._arcoAnonymizedAt = new Date().toISOString();
  return clean;
}
