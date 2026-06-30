/** Acciones auditadas en Fase 2 (extensible en Fase 3+). */
export const AUDIT_ACTIONS = {
  treasuryCreate: "treasury.create",
  playerCreate: "player.create",
  playerUpdate: "player.update",
  playerDelete: "player.delete",
  settingsUpdate: "settings.update",
  ownershipTransfer: "ownership.transfer",
  documentEmit: "document.emit",
  carnetEmit: "carnet.emit",
  tournamentCreate: "tournament.create",
  tournamentPublish: "tournament.publish",
  tournamentDelete: "tournament.delete",
  tournamentMatchResult: "tournament.match_result",
  tournamentFinish: "tournament.finish",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string;

const PII_PAYLOAD_KEYS = new Set([
  "documentnumber",
  "document_number",
  "dni",
  "dnidelegado",
  "dnientrenador",
  "tutor_document_number",
  "tutordocumentnumber",
  "full_name",
  "fullname",
  "firstname",
  "first_name",
  "lastname",
  "last_name",
  "apellidos",
  "nombres",
  "name",
  "birthdate",
  "fecha_nacimiento",
  "fechanacimiento",
  "photourl",
  "photo_url",
  "email",
  "phone",
  "telefono",
  "snapshot",
  "password",
]);

/** Valores escalares que parecen número de documento (8–12 dígitos). */
function looksLikeDocumentScalar(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return /^\d{8,12}$/.test(v);
}

function shouldStripPayloadEntry(key: string, value: unknown): boolean {
  const normalized = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (PII_PAYLOAD_KEYS.has(normalized)) return true;
  if (/document|dni|tutor/i.test(key)) return true;
  return looksLikeDocumentScalar(value);
}

const MAX_PAYLOAD_JSON_BYTES = 8_192;

/** Elimina claves sensibles y limita tamaño del JSON de auditoría. */
export function sanitizeAuditPayload(
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (shouldStripPayloadEntry(key, value)) continue;
    if (value === undefined) continue;
    clean[key] = value;
  }

  if (Object.keys(clean).length === 0) return null;

  let serialized = JSON.stringify(clean);
  if (serialized.length <= MAX_PAYLOAD_JSON_BYTES) return clean;

  const trimmed: Record<string, unknown> = { _truncated: true };
  for (const [key, value] of Object.entries(clean)) {
    trimmed[key] = value;
    serialized = JSON.stringify(trimmed);
    if (serialized.length > MAX_PAYLOAD_JSON_BYTES) {
      delete trimmed[key];
    } else {
      break;
    }
  }
  return Object.keys(trimmed).length > 1 ? trimmed : { _truncated: true };
}
