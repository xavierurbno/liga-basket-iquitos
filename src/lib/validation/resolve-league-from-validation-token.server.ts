import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, clubs, players } from "@/lib/db/schema";
import { verifyEntityValidationToken } from "@/lib/validation/entity-validation-token";

export type ResolveLeagueFromValidationTokenResult =
  | { ok: true; leagueId: string }
  | { ok: false; error: string };

/** Deriva `leagueId` desde un token firmado de `/validar` (jugador o categoría). */
export async function resolveLeagueIdFromValidationToken(
  tokenSegment: string,
): Promise<ResolveLeagueFromValidationTokenResult> {
  const raw = tokenSegment.trim();
  if (!raw) {
    return { ok: false, error: "Token de validación requerido." };
  }

  const verified = verifyEntityValidationToken(raw);
  if (!verified) {
    return { ok: false, error: "Token de validación inválido." };
  }

  if (verified.kind === "player") {
    const [row] = await db
      .select({ leagueId: clubs.leagueId })
      .from(players)
      .innerJoin(clubs, eq(players.clubId, clubs.id))
      .where(eq(players.id, verified.entityId))
      .limit(1);

    const leagueId = row?.leagueId?.trim();
    if (!leagueId) {
      return { ok: false, error: "No se encontró la liga del deportista." };
    }
    return { ok: true, leagueId };
  }

  const [row] = await db
    .select({ leagueId: clubs.leagueId })
    .from(categories)
    .innerJoin(clubs, eq(categories.clubId, clubs.id))
    .where(eq(categories.id, verified.entityId))
    .limit(1);

  const leagueId = row?.leagueId?.trim();
  if (!leagueId) {
    return { ok: false, error: "No se encontró la liga del equipo." };
  }
  return { ok: true, leagueId };
}
