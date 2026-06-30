import { lt } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/lib/db/client";
import { auditEvents } from "@/lib/db/schema";
import type * as schema from "@/lib/db/schema";

type Db = PostgresJsDatabase<typeof schema>;

const DEFAULT_RETENTION_YEARS = 1;

function retentionYears(): number {
  const raw = process.env.AUDIT_EVENTS_RETENTION_YEARS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 10) return parsed;
  return DEFAULT_RETENTION_YEARS;
}

function cutoffDate(years = retentionYears()): Date {
  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  return cutoff;
}

/** Elimina eventos de auditoría anteriores al período de retención (default: 1 año). */
export async function purgeAuditEvents(
  database: Db = db,
  options?: { years?: number },
): Promise<{ deleted: number; cutoffIso: string }> {
  const years = options?.years ?? retentionYears();
  const cutoff = cutoffDate(years);

  const deletedRows = await database
    .delete(auditEvents)
    .where(lt(auditEvents.createdAt, cutoff))
    .returning({ id: auditEvents.id });

  return {
    deleted: deletedRows.length,
    cutoffIso: cutoff.toISOString(),
  };
}

export function auditRetentionPolicySummary(): {
  auditEventsYears: number;
  vercelLogsDays: number;
} {
  const vercelRaw = process.env.VERCEL_LOG_RETENTION_DAYS?.trim();
  const vercelDays = vercelRaw ? Number.parseInt(vercelRaw, 10) : 90;
  return {
    auditEventsYears: retentionYears(),
    vercelLogsDays: Number.isFinite(vercelDays) ? vercelDays : 90,
  };
}
