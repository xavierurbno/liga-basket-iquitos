import { headers } from "next/headers";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/lib/db/client";
import { auditEvents } from "@/lib/db/schema";
import type * as schema from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/withAuth";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";

type Db = PostgresJsDatabase<typeof schema>;

/** Acciones auditadas en Fase 2 (extensible en Fase 3+). */
export const AUDIT_ACTIONS = {
  treasuryCreate: "treasury.create",
  playerCreate: "player.create",
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
  "email",
  "phone",
  "telefono",
  "snapshot",
  "password",
]);

const MAX_PAYLOAD_JSON_BYTES = 8_192;

export type RecordAuditInput = {
  actorId: string;
  actorRole?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  leagueId?: string | null;
  clubId?: string | null;
  clientIp?: string | null;
  payload?: Record<string, unknown> | null;
};

/** Elimina claves sensibles y limita tamaño del JSON de auditoría. */
export function sanitizeAuditPayload(
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    const normalized = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (PII_PAYLOAD_KEYS.has(normalized)) continue;
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

function normalizeClientIp(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  return ip.length > 45 ? ip.slice(0, 45) : ip;
}

/**
 * Persiste un evento de auditoría. No lanza excepciones (fallo silencioso + log).
 */
export async function recordAudit(
  input: RecordAuditInput,
  database: Db = db,
): Promise<string | null> {
  try {
    const payload = sanitizeAuditPayload(input.payload ?? null);

    const [row] = await database
      .insert(auditEvents)
      .values({
        actorId: input.actorId,
        actorRole: input.actorRole ?? null,
        action: input.action.slice(0, 80),
        entityType: input.entityType.slice(0, 50),
        entityId: input.entityId ?? null,
        leagueId: input.leagueId ?? null,
        clubId: input.clubId ?? null,
        clientIp: normalizeClientIp(input.clientIp),
        payload: payload ?? null,
      })
      .returning({ id: auditEvents.id });

    return row?.id ?? null;
  } catch (error) {
    console.error("[recordAudit]", error);
    return null;
  }
}

/** IP del request actual (server actions / route handlers). */
export async function getAuditClientIp(): Promise<string | null> {
  try {
    const headerStore = await headers();
    return normalizeClientIp(getClientIpFromHeaders(headerStore));
  } catch {
    return null;
  }
}

/** Atajo con contexto de sesión intranet. */
export async function recordAuditFromContext(
  context: AuthContext,
  input: Omit<RecordAuditInput, "actorId" | "actorRole" | "clientIp"> & {
    clientIp?: string | null;
  },
  database: Db = db,
): Promise<string | null> {
  const clientIp = input.clientIp ?? (await getAuditClientIp());
  return recordAudit(
    {
      ...input,
      actorId: context.userId,
      actorRole: context.role,
      clientIp,
    },
    database,
  );
}
