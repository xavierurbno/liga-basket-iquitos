import "server-only";

import { and, eq, or, sql, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clubs, players } from "@/lib/db/schema";
import { resolveLeagueCarnetPrefix } from "@/lib/leagues/league-carnet-prefix";
import { generarNumeroFichaDesdeCategoriaClub } from "@/lib/utils/category";
import { categoryRepository } from "@/repositories/categoryRepository";
import { leagueRepository } from "@/repositories/league.repository";
import { playerRepository } from "@/repositories/playerRepository";

export type AssignCarnetNumberResult =
  | { ok: true; carnetNumber: string; created: boolean }
  | { ok: false; error: string };

/** Asigna `{IQ}-{año}-{cat}-{seq}` si el jugador aún no tiene `carnet_number` en BD. */
export async function assignPlayerCarnetNumberIfMissing(
  playerId: string,
  clubId: string,
  categoryId: string,
): Promise<AssignCarnetNumberResult> {
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`
        SELECT id FROM players
        WHERE id = ${playerId}
          AND club_id = ${clubId}
          AND category_id = ${categoryId}
        FOR UPDATE
      `);

      const player = await playerRepository.findForCarnet(playerId, clubId, categoryId, tx);
      if (!player) return { ok: false, error: "Deportista no encontrado." };

      const existing = player.carnetNumber?.trim();
      if (existing) return { ok: true, carnetNumber: existing, created: false };

      const catRow = await categoryRepository.findById(categoryId, tx);
      if (!catRow || catRow.clubId !== clubId) {
        return { ok: false, error: "Categoría no encontrada para este club." };
      }

      if (!player.birthdate) {
        return { ok: false, error: "El deportista no tiene fecha de nacimiento registrada." };
      }

      const [clubRow] = await tx
        .select({ leagueId: clubs.leagueId })
        .from(clubs)
        .where(eq(clubs.id, clubId))
        .limit(1);

      const leagueRow = clubRow?.leagueId
        ? await leagueRepository.findById(clubRow.leagueId)
        : null;

      const cityPrefix = resolveLeagueCarnetPrefix({
        slug: leagueRow?.slug,
        name: leagueRow?.name,
      });

      const seqResult = await tx.execute(sql`SELECT nextval('carnet_deportista_seq')`);
      const nextVal = Number(seqResult[0].nextval);

      const carnetNumber = generarNumeroFichaDesdeCategoriaClub(
        catRow.name,
        player.birthdate,
        nextVal,
        new Date().getFullYear(),
        cityPrefix,
      );

      const [updated] = await tx
        .update(players)
        .set({ carnetNumber, updatedAt: new Date() })
        .where(
          and(
            eq(players.id, playerId),
            eq(players.clubId, clubId),
            eq(players.categoryId, categoryId),
            or(isNull(players.carnetNumber), sql`trim(${players.carnetNumber}) = ''`),
          ),
        )
        .returning({ carnetNumber: players.carnetNumber });

      if (updated?.carnetNumber?.trim()) {
        return { ok: true, carnetNumber: updated.carnetNumber.trim(), created: true };
      }

      const afterRace = await playerRepository.findForCarnet(playerId, clubId, categoryId, tx);
      const raced = afterRace?.carnetNumber?.trim();
      if (raced) return { ok: true, carnetNumber: raced, created: false };

      return { ok: false, error: "No se pudo asignar el número de carnet." };
    });
  } catch (error) {
    console.error("[assignPlayerCarnetNumberIfMissing]", error);
    return { ok: false, error: "No se pudo asignar el número de carnet." };
  }
}
