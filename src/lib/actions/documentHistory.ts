"use server";

import { db } from "@/lib/db/client";
import { documentHistory } from "@/lib/db/schema";
import { desc, eq, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
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

  try {
    const { type, entityId, shortIdentifier } = data;
    const snapshot = data;
    const leagueId =
      data.leagueId?.trim() || auth.context.leagueId?.trim() || null;

    const [row] = await db
      .insert(documentHistory)
      .values({
        type,
        entityId,
        shortIdentifier,
        snapshot,
        leagueId,
      })
      .returning({
        correlative: documentHistory.correlative,
        createdAt: documentHistory.createdAt,
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

  const scopeLeagueId =
    filterLeagueId?.trim() ||
    (auth.context.role === "LEAGUE_ADMIN" ? auth.context.leagueId?.trim() : null) ||
    (auth.context.role === "SUPER_ADMIN" ? auth.context.leagueId?.trim() : null) ||
    null;

  try {
    const whereClause = scopeLeagueId
      ? eq(documentHistory.leagueId, scopeLeagueId)
      : auth.context.role === "SUPER_ADMIN"
        ? undefined
        : isNull(documentHistory.leagueId);

    const base = db
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
      .orderBy(desc(documentHistory.createdAt))
      .limit(20);

    const rows = whereClause ? await base.where(whereClause) : await base;

    return { ok: true as const, emisiones: rows };
  } catch (error) {
    console.error("[obtenerUltimasEmisiones]", error);
    return { ok: false as const, error: "Error al obtener el historial." };
  }
}
