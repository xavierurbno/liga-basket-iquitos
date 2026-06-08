import { createHmac, timingSafeEqual } from "node:crypto";

export type ValidationEntityKind = "player" | "category";

const TOKEN_VERSION = "v1";

function validationSecret(): string {
  const explicit = process.env.VALIDATION_TOKEN_SECRET?.trim();
  if (explicit) return explicit;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "VALIDATION_TOKEN_SECRET es obligatorio en producción para enlaces /validar.",
    );
  }

  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (fallback) {
    console.warn(
      "[validation-token] VALIDATION_TOKEN_SECRET no definido; usando fallback solo para desarrollo.",
    );
    return fallback;
  }

  throw new Error(
    "Define VALIDATION_TOKEN_SECRET en .env.local (mín. 32 caracteres aleatorios).",
  );
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", validationSecret())
    .update(`${TOKEN_VERSION}.${payloadB64}`)
    .digest("base64url");
}

function signaturesMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Token opaco para QR de validación (no expone UUID en URLs nuevas). */
export function createEntityValidationToken(
  entityId: string,
  kind: ValidationEntityKind,
): string {
  const id = entityId.trim();
  if (!id) throw new Error("entityId requerido");
  const payloadB64 = Buffer.from(JSON.stringify({ e: id, k: kind }), "utf8").toString(
    "base64url",
  );
  return `${TOKEN_VERSION}.${payloadB64}.${signPayload(payloadB64)}`;
}

export function verifyEntityValidationToken(
  token: string,
): { entityId: string; kind: ValidationEntityKind } | null {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return null;

  const payloadB64 = parts[1]!;
  const sig = parts[2]!;
  const expected = signPayload(payloadB64);
  if (!signaturesMatch(sig, expected)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as { e?: string; k?: ValidationEntityKind };
    const entityId = parsed.e?.trim();
    if (!entityId) return null;
    if (parsed.k !== "player" && parsed.k !== "category") return null;
    return { entityId, kind: parsed.k };
  } catch {
    return null;
  }
}

export function buildPublicValidationUrl(
  entityId: string,
  kind: ValidationEntityKind,
  baseOrigin = "",
): string | null {
  try {
    const token = createEntityValidationToken(entityId, kind);
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      baseOrigin.trim();
    if (!siteUrl) return null;
    return `${siteUrl.replace(/\/+$/, "")}/validar/${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}
