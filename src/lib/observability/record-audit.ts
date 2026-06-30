import { headers } from "next/headers";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/lib/db/client";
import { auditEvents } from "@/lib/db/schema";
import type * as schema from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/withAuth";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import {
  AUDIT_ACTIONS,
  sanitizeAuditPayload,
  type AuditAction,
} from "./audit-payload-sanitizer";

export { AUDIT_ACTIONS, sanitizeAuditPayload, type AuditAction };

type Db = PostgresJsDatabase<typeof schema>;

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
