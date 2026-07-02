"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
import type { User } from "@supabase/supabase-js";
import { assertOperationalLeagueMatch } from "@/lib/auth/assert-league-scope";
import { withOperationalRead, withOperationalWrite, type OperationalTx } from "@/lib/db/operational-db-access";
import { playerRepository } from "@/repositories/playerRepository";
import { clubRepository } from "@/repositories/clubRepository";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";
import { AUDIT_ACTIONS, recordAuditFromContext } from "@/lib/observability/record-audit";
import {
  anonymizePlayerForArco,
  buildPlayerArcoExport,
  type PlayerArcoExport,
} from "@/lib/privacy/player-arco";

const arcoRequestSchema = z.object({
  playerId: z.string().uuid(),
  clubId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
});

export type PlayerArcoActionState =
  | { success: true; export?: PlayerArcoExport; message?: string }
  | { success: false; error: string };

async function assertArcoPlayerScope(
  user: User,
  context: AuthContext,
  playerId: string,
  clubId: string,
): Promise<{ ok: true; leagueId: string | null } | { ok: false; error: string }> {
  if (context.role === "CLUB_DELEGATE") {
    if (context.clubId !== clubId) {
      return { ok: false, error: "No tienes permiso para operar sobre este club." };
    }
  }

  const player = await withOperationalRead(user, context, (tx) =>
    playerRepository.findById(playerId, tx),
  );
  if (!player) {
    return { ok: false, error: "Jugador no encontrado." };
  }
  if (player.clubId !== clubId) {
    return { ok: false, error: "El jugador no pertenece a este club." };
  }

  const club = await withOperationalRead(user, context, (tx) => clubRepository.findById(clubId, tx));
  const leagueId = club?.leagueId ?? player.leagueId ?? null;

  if (leagueId) {
    const leagueError = assertOperationalLeagueMatch(context, leagueId);
    if (leagueError) return { ok: false, error: leagueError };
  }

  if (context.role === "CLUB_DELEGATE") {
    return { ok: false, error: "La gestión ARCO la realiza el administrador de liga." };
  }

  return { ok: true, leagueId };
}

/** Exportación ARCO (derecho de acceso) — solo staff de liga. */
export const exportPlayerArcoAction = withAuth(
  async (
    formData: FormData,
    user: User,
    context: AuthContext,
  ): Promise<PlayerArcoActionState> => {
    const rateError = await enforceRateLimit("arco");
    if (rateError) return { success: false, error: rateError };

    const parsed = arcoRequestSchema.safeParse({
      playerId: formData.get("playerId"),
      clubId: formData.get("clubId"),
      categoryId: formData.get("categoryId") || undefined,
    });
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos para exportación ARCO." };
    }

    const { playerId, clubId } = parsed.data;
    const scope = await assertArcoPlayerScope(user, context, playerId, clubId);
    if (!scope.ok) return { success: false, error: scope.error };

    const exportPayload = await withOperationalRead(user, context, (tx) =>
      buildPlayerArcoExport(playerId, tx as unknown as OperationalTx),
    );
    if (!exportPayload) {
      return { success: false, error: "Jugador no encontrado." };
    }

    await recordAuditFromContext(context, {
      action: AUDIT_ACTIONS.playerArcoExport,
      entityType: "player",
      entityId: playerId,
      leagueId: scope.leagueId,
      clubId,
      payload: { playerId, arcoRight: "access" },
    });

    return { success: true, export: exportPayload };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);

/** Cancelación ARCO: anonimización y purga de PII asociada. */
export const anonymizePlayerArcoAction = withAuth(
  async (
    formData: FormData,
    user: User,
    context: AuthContext,
  ): Promise<PlayerArcoActionState> => {
    const rateError = await enforceRateLimit("arco");
    if (rateError) return { success: false, error: rateError };

    const confirm = formData.get("confirm");
    if (confirm !== "ANONIMIZAR") {
      return {
        success: false,
        error: 'Escribe "ANONIMIZAR" para confirmar la cancelación ARCO.',
      };
    }

    const parsed = arcoRequestSchema.safeParse({
      playerId: formData.get("playerId"),
      clubId: formData.get("clubId"),
      categoryId: formData.get("categoryId") || undefined,
    });
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos para anonimización ARCO." };
    }

    const { playerId, clubId, categoryId } = parsed.data;
    const scope = await assertArcoPlayerScope(user, context, playerId, clubId);
    if (!scope.ok) return { success: false, error: scope.error };

    const resultSummary = await withOperationalWrite(user, context, async (tx) => {
      await recordAuditFromContext(
        context,
        {
          action: AUDIT_ACTIONS.playerArcoAnonymize,
          entityType: "player",
          entityId: playerId,
          leagueId: scope.leagueId,
          clubId,
          payload: { playerId, arcoRight: "cancellation" },
        },
        tx,
      );

      return anonymizePlayerForArco(playerId, tx);
    });

    if (!resultSummary) {
      return { success: false, error: "No se pudo anonimizar al jugador." };
    }

    if (categoryId) {
      revalidatePath(`/liga/clubs/${clubId}/categories/${categoryId}/`, "page" as never);
    }
    revalidatePath(`/liga/clubs/${clubId}/`, "page" as never);

    return {
      success: true,
      message: `Jugador anonimizado. Historial documental: ${resultSummary.documentHistoryRowsUpdated} fila(s); documentos adjuntos: ${resultSummary.documentsRemoved}.`,
    };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);
