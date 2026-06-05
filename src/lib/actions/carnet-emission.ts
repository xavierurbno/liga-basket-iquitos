"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clubs, players } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/require-auth";
import { clubBelongsToOperationalLeague } from "@/lib/auth/operational-league-scope";
import type { Role } from "@/lib/auth/withAuth";
import { AUDIT_ACTIONS, getAuditClientIp, recordAudit } from "@/lib/observability/record-audit";
import { readUserRole } from "@/lib/auth/read-user-role";
import { playerRepository } from "@/repositories/playerRepository";

const CARNET_EMISSION_ROLES: Role[] = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"];

export type EmitirCarnetResult =
  | {
      ok: true;
      credentialVersion: number;
      credentialIssuedAt: string;
    }
  | { ok: false; error: string };

async function assertCanEmitCarnet(
  playerId: string,
  clubId: string,
  categoryId: string,
  context: { role: Role; clubId?: string; leagueId?: string },
): Promise<
  | { ok: true; leagueId: string | null; hasPhoto: boolean; hasCarnetNumber: boolean }
  | { ok: false; error: string }
> {
  const [row] = await db
    .select({
      clubId: players.clubId,
      categoryId: players.categoryId,
      leagueId: clubs.leagueId,
      photoUrl: players.photoUrl,
      carnetNumber: players.carnetNumber,
    })
    .from(players)
    .innerJoin(clubs, eq(players.clubId, clubs.id))
    .where(eq(players.id, playerId))
    .limit(1);

  if (!row) return { ok: false, error: "Deportista no encontrado." };
  if (row.clubId !== clubId || row.categoryId !== categoryId) {
    return { ok: false, error: "El deportista no pertenece a este club o categoría." };
  }

  if (context.role === "CLUB_DELEGATE") {
    if (!context.clubId || context.clubId !== row.clubId) {
      return { ok: false, error: "No puedes emitir el carnet de este deportista." };
    }
  } else if (
    context.leagueId?.trim() &&
    row.leagueId &&
    !clubBelongsToOperationalLeague(row.leagueId, context.leagueId, context.role)
  ) {
    return { ok: false, error: "El deportista no pertenece a tu liga activa." };
  }

  return {
    ok: true,
    leagueId: row.leagueId ?? null,
    hasPhoto: Boolean(row.photoUrl?.trim()),
    hasCarnetNumber: Boolean(row.carnetNumber?.trim()),
  };
}

/** Registra la emisión digital del carnet (incrementa versión y fecha en BD). */
export async function emitirCarnetAction(
  playerId: string,
  clubId: string,
  categoryId: string,
): Promise<EmitirCarnetResult> {
  const auth = await requireAuth(CARNET_EMISSION_ROLES);
  if (auth.denied) return { ok: false, error: auth.error };

  const scope = await assertCanEmitCarnet(playerId, clubId, categoryId, auth.context);
  if (!scope.ok) return { ok: false, error: scope.error };

  if (!scope.hasPhoto) {
    return { ok: false, error: "Sube la foto del deportista antes de emitir el carnet." };
  }
  if (!scope.hasCarnetNumber) {
    return { ok: false, error: "El deportista no tiene número de carnet asignado." };
  }

  try {
    const row = await playerRepository.emitCredential(playerId, clubId, categoryId);
    if (!row?.credentialIssuedAt) {
      return { ok: false, error: "No se pudo registrar la emisión del carnet." };
    }

    await recordAudit({
      actorId: auth.user.id,
      actorRole: readUserRole(auth.user),
      action: AUDIT_ACTIONS.carnetEmit,
      entityType: "player",
      entityId: playerId,
      leagueId: scope.leagueId,
      clubId,
      clientIp: await getAuditClientIp(),
      payload: {
        playerId,
        clubId,
        categoryId,
        credentialVersion: row.credentialVersion,
      },
    });

    revalidatePath(
      `/liga/clubs/${clubId}/categories/${categoryId}/players/${playerId}/carnet`,
    );
    revalidatePath(`/liga/clubs/${clubId}/categories/${categoryId}`);

    return {
      ok: true,
      credentialVersion: row.credentialVersion,
      credentialIssuedAt: row.credentialIssuedAt.toISOString(),
    };
  } catch (error) {
    console.error("[emitirCarnetAction]", error);
    return { ok: false, error: "Error al emitir el carnet." };
  }
}
