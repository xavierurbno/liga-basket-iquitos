import { and, eq, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clubs, documentHistory, players } from "@/lib/db/schema";
import { clubBelongsToOperationalLeague } from "@/lib/auth/operational-league-scope";
import type { AuthContext } from "@/lib/auth/withAuth";
import type { DocumentoInput } from "@/lib/pdf/documentosInstitucionalesPdf";

const PLAYER_DOC_TYPES = new Set(["CARTA_PASE", "CONSTANCIA"]);
const CLUB_DOC_TYPES = new Set(["SOLVENCIA_CLUB"]);

export function resolveDocumentHistoryLeagueId(
  context: AuthContext,
  filterLeagueId?: string | null,
): { leagueId: string } | { error: string } {
  const fromFilter = filterLeagueId?.trim();
  const fromContext = context.leagueId?.trim();

  if (context.role === "CLUB_DELEGATE") {
    if (!fromContext) {
      return { error: "Tu cuenta no tiene liga asignada para consultar el historial." };
    }
    return { leagueId: fromContext };
  }

  const leagueId = fromFilter || fromContext;
  if (!leagueId) {
    return {
      error:
        "Selecciona una liga activa en la barra superior antes de consultar el historial documental.",
    };
  }

  return { leagueId };
}

/** Condición SQL para historial acotado por rol. */
export async function buildDocumentHistoryWhere(
  context: AuthContext,
  leagueId: string,
): Promise<SQL | { error: string }> {
  const leagueClause = eq(documentHistory.leagueId, leagueId);

  if (context.role === "CLUB_DELEGATE") {
    const clubId = context.clubId?.trim();
    if (!clubId) {
      return { error: "Tu cuenta no tiene un club asignado." };
    }

    const playerRows = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.clubId, clubId));

    const playerIds = playerRows.map((r) => r.id);
    const entityClause =
      playerIds.length > 0
        ? or(
            and(eq(documentHistory.type, "SOLVENCIA_CLUB"), eq(documentHistory.entityId, clubId)),
            inArray(documentHistory.entityId, playerIds),
          )
        : and(eq(documentHistory.type, "SOLVENCIA_CLUB"), eq(documentHistory.entityId, clubId));

    return and(leagueClause, entityClause)!;
  }

  return leagueClause;
}

/** Valida que la emisión corresponda al alcance del operador. */
export async function assertDocumentEmissionAllowed(
  context: AuthContext,
  data: DocumentoInput,
): Promise<{ ok: true; leagueId: string | null } | { ok: false; error: string }> {
  const leagueId = data.leagueId?.trim() || context.leagueId?.trim() || null;

  if (context.role === "CLUB_DELEGATE") {
    const clubId = context.clubId?.trim();
    if (!clubId) {
      return { ok: false, error: "Tu cuenta no tiene un club asignado." };
    }

    if (CLUB_DOC_TYPES.has(data.type)) {
      if (data.entityId.trim() !== clubId) {
        return { ok: false, error: "No puedes emitir solvencia para otro club." };
      }
    } else if (PLAYER_DOC_TYPES.has(data.type)) {
      const [player] = await db
        .select({ clubId: players.clubId })
        .from(players)
        .where(eq(players.id, data.entityId.trim()))
        .limit(1);
      if (!player || player.clubId !== clubId) {
        return { ok: false, error: "No puedes emitir documentos de jugadores ajenos a tu club." };
      }
    }

    const [club] = await db
      .select({ leagueId: clubs.leagueId })
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);
    if (!club?.leagueId) {
      return { ok: false, error: "El club no tiene liga asignada." };
    }

    return { ok: true, leagueId: club.leagueId };
  }

  if (
    (context.role === "LEAGUE_ADMIN" || context.role === "SUPER_ADMIN") &&
    leagueId &&
    !clubBelongsToOperationalLeague(leagueId, context.leagueId, context.role)
  ) {
    return {
      ok: false,
      error: "El documento no pertenece a la liga activa seleccionada en el panel.",
    };
  }

  if (
    (context.role === "LEAGUE_ADMIN" || context.role === "SUPER_ADMIN") &&
    !leagueId
  ) {
    return {
      ok: false,
      error: "Selecciona una liga activa antes de registrar la emisión.",
    };
  }

  if (PLAYER_DOC_TYPES.has(data.type) && leagueId) {
    const entityId = data.entityId.trim();
    const [playerRow] = await db
      .select({ clubLeagueId: clubs.leagueId })
      .from(players)
      .innerJoin(clubs, eq(players.clubId, clubs.id))
      .where(eq(players.id, entityId))
      .limit(1);

    if (!playerRow?.clubLeagueId) {
      return { ok: false, error: "Jugador no encontrado o sin liga asignada." };
    }
    if (playerRow.clubLeagueId !== leagueId) {
      return {
        ok: false,
        error: "El jugador no pertenece a la liga de este documento.",
      };
    }
  }

  if (CLUB_DOC_TYPES.has(data.type) && leagueId) {
    const entityId = data.entityId.trim();
    const [clubRow] = await db
      .select({ leagueId: clubs.leagueId })
      .from(clubs)
      .where(eq(clubs.id, entityId))
      .limit(1);

    if (!clubRow?.leagueId) {
      return { ok: false, error: "Club no encontrado o sin liga asignada." };
    }
    if (clubRow.leagueId !== leagueId) {
      return {
        ok: false,
        error: "El club no pertenece a la liga de este documento.",
      };
    }
  }

  return { ok: true, leagueId };
}
