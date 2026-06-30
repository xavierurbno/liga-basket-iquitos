"use server";

import { playerStatusEnum, type PlayerStatus } from "@/lib/db/schema";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
import { isSuperAdminDataScope } from "@/lib/auth/intranet-roles";
import { withOperationalRead, withOperationalWrite } from "@/lib/db/operational-db-access";
import { clubRepository } from "@/repositories/clubRepository";
import { playerRepository } from "@/repositories/playerRepository";
import type { ActionResult } from "@/lib/types/league";
import type { User } from "@supabase/supabase-js";

/** Cambio rápido de estado desde Búsqueda 365 (solo staff de liga). */
export const actualizarEstadoJugadorBusqueda365Action = withAuth(
  async (playerId: string, status: string, user: User, context: AuthContext): Promise<ActionResult> => {
    const allowed = playerStatusEnum.enumValues as readonly string[];
    if (!allowed.includes(status)) {
      return { success: false, error: "Estado no válido." };
    }

    const player = await withOperationalRead(user, context, (readTx) =>
      playerRepository.findById(playerId, readTx),
    );
    if (!player) {
      return { success: false, error: "Jugador no encontrado." };
    }

    const bypass = isSuperAdminDataScope(context.role);
    if (!bypass) {
      if (context.role === "CLUB_DELEGATE") {
        if (!context.clubId || player.clubId !== context.clubId) {
          return { success: false, error: "No autorizado para este club." };
        }
      }
      if (context.role === "LEAGUE_ADMIN") {
        const club = await withOperationalRead(user, context, (readTx) =>
          clubRepository.findById(player.clubId, readTx),
        );
        if (!club?.leagueId || !context.leagueId || club.leagueId !== context.leagueId) {
          return { success: false, error: "No autorizado en esta liga." };
        }
      }
    }

    await withOperationalWrite(user, context, (writeTx) =>
      playerRepository.updateStatus(
        playerId,
        status as PlayerStatus,
        writeTx,
        bypass
          ? { bypassClubFilter: true, actingRole: context.role }
          : { actingRole: context.role, clubId: player.clubId },
      ),
    );

    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);
