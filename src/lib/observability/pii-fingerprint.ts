import { createHash } from "node:crypto";

function resolvePiiSalt(): string {
  const salt =
    process.env.PII_LOG_HASH_SALT?.trim() || process.env.VALIDATION_TOKEN_SECRET?.trim();
  if (salt) return salt;
  if (process.env.NODE_ENV === "production") {
    console.warn("[pii-fingerprint] PII_LOG_HASH_SALT no configurado; hashes predecibles.");
  }
  return "dev-pii-log-salt";
}

/** Huella de documento de identidad sin almacenar el número completo. */
export function fingerprintDocument(
  documentNumber: string,
  documentType?: string | null,
): { docLast4: string | null; docHash: string } {
  const trimmed = documentNumber.trim();
  const normalized = trimmed.replace(/[^a-zA-Z0-9]/g, "") || trimmed;
  const docLast4 =
    normalized.length >= 4
      ? normalized.slice(-4)
      : normalized.length > 0
        ? normalized
        : null;
  const docHash = createHash("sha256")
    .update(`${resolvePiiSalt()}:doc:${documentType ?? ""}:${normalized.toUpperCase()}`)
    .digest("hex")
    .slice(0, 16);
  return { docLast4, docHash };
}

/** Huella de token opaco (/validar) sin registrar el valor completo. */
export function fingerprintOpaqueToken(token: string): {
  tokenHash: string;
  legacyUuid: boolean;
} {
  const raw = token.trim();
  const legacyUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
  const tokenHash = createHash("sha256")
    .update(`${resolvePiiSalt()}:token:${raw}`)
    .digest("hex")
    .slice(0, 16);
  return { tokenHash, legacyUuid };
}

/** Huella de término de búsqueda (nombre, club, etc.) sin texto plano en logs. */
export function fingerprintSearchTerm(term: string): { termLen: number; termHash: string } {
  const t = term.trim();
  const termHash = createHash("sha256")
    .update(`${resolvePiiSalt()}:term:${t.toLowerCase()}`)
    .digest("hex")
    .slice(0, 12);
  return { termLen: t.length, termHash };
}
