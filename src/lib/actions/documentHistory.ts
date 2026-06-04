"use server";

import { db } from "@/lib/db/client";
import { documentHistory } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import {
  assertDocumentEmissionAllowed,
  buildDocumentHistoryWhere,
  resolveDocumentHistoryLeagueId,
} from "@/lib/auth/document-emission-scope";
import { requireAuth } from "@/lib/auth/require-auth";
import { AUDIT_ACTIONS, getAuditClientIp, recordAudit } from "@/lib/observability/record-audit";
import { readUserRole } from "@/lib/auth/read-user-role";
import type { DocumentoInput } from "@/lib/pdf/documentosInstitucionalesPdf";

const DOCUMENT_HISTORY_ROLES = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"] as const;

export type RegistroEmisionResult =
  | { ok: true; correlative: number; createdAt: string }
  | { ok: false; error: string };

export async function registrarEmisionDocumento(
  data: DocumentoInput & { shortIdentifier: string },
): Promise<RegistroEmisionResult> {
  const auth = await requireAuth([...DOCUMENT_HISTORY_ROLES]);
  if (auth.denied) return { ok: false, error: auth.error };

  const scope = await assertDocumentEmissionAllowed(auth.context, data);
  if (!scope.ok) return { ok: false, error: scope.error };

  try {
    const { type, entityId, shortIdentifier } = data;
    const snapshot = data;

    const [row] = await db
      .insert(documentHistory)
      .values({
        type,
        entityId,
        shortIdentifier,
        snapshot,
        leagueId: scope.leagueId,
      })
      .returning({
        id: documentHistory.id,
        correlative: documentHistory.correlative,
        createdAt: documentHistory.createdAt,
      });

    await recordAudit({
      actorId: auth.user.id,
      actorRole: readUserRole(auth.user),
      action: AUDIT_ACTIONS.documentEmit,
      entityType: "document_history",
      entityId: row.id,
      leagueId: scope.leagueId,
      clubId: auth.context.clubId,
      clientIp: await getAuditClientIp(),
      payload: {
        documentHistoryId: row.id,
        type,
        entityId,
        shortIdentifier,
        correlative: row.correlative,
      },
    });

    return {
      ok: true,
      correlative: row.correlative,
      createdAt: row.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("[registrarEmisionDocumento]", error);
    return { ok: false, error: "Error al registrar la emisión del documento." };
  }
}

export async function obtenerUltimasEmisiones(filterLeagueId?: string | null) {
  const auth = await requireAuth([...DOCUMENT_HISTORY_ROLES]);
  if (auth.denied) return { ok: false as const, error: auth.error };

  const leagueScope = resolveDocumentHistoryLeagueId(auth.context, filterLeagueId);
  if ("error" in leagueScope) {
    return { ok: false as const, error: leagueScope.error };
  }

  const whereResult = await buildDocumentHistoryWhere(auth.context, leagueScope.leagueId);
  if ("error" in whereResult) {
    return { ok: false as const, error: whereResult.error };
  }

  try {
    const rows = await db
      .select({
        id: documentHistory.id,
        type: documentHistory.type,
        shortIdentifier: documentHistory.shortIdentifier,
        correlative: documentHistory.correlative,
        createdAt: documentHistory.createdAt,
        snapshot: documentHistory.snapshot,
        leagueId: documentHistory.leagueId,
      })
      .from(documentHistory)
      .where(whereResult)
      .orderBy(desc(documentHistory.createdAt))
      .limit(20);

    return { ok: true as const, emisiones: rows };
  } catch (error) {
    console.error("[obtenerUltimasEmisiones]", error);
    return { ok: false as const, error: "Error al obtener el historial." };
  }
}
