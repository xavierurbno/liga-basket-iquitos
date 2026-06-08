"use server";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, clubs, players } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  clubBelongsToOperationalLeague,
} from "@/lib/auth/operational-league-scope";
import type { Role } from "@/lib/auth/withAuth";
import {
  buildPublicValidationUrl,
  type ValidationEntityKind,
} from "@/lib/validation/entity-validation-token";

const VALIDATION_URL_ROLES: Role[] = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"];

export type EntityValidationUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

async function assertCanIssueValidationUrl(
  entityId: string,
  kind: ValidationEntityKind,
  context: { role: Role; clubId?: string; leagueId?: string },
): Promise<{ ok: true; leagueId: string | null } | { ok: false; error: string }> {
  const id = entityId.trim();
  if (!id) return { ok: false, error: "Identificador inválido." };

  if (kind === "player") {
    const [row] = await db
      .select({
        clubId: players.clubId,
        leagueId: clubs.leagueId,
      })
      .from(players)
      .innerJoin(clubs, eq(players.clubId, clubs.id))
      .where(eq(players.id, id))
      .limit(1);

    if (!row) return { ok: false, error: "Jugador no encontrado." };

    if (context.role === "CLUB_DELEGATE") {
      if (!context.clubId || context.clubId !== row.clubId) {
        return { ok: false, error: "No puedes emitir validación para este deportista." };
      }
    } else if (context.role === "LEAGUE_ADMIN") {
      if (!context.leagueId?.trim()) {
        return { ok: false, error: "Selecciona una liga activa antes de emitir validación." };
      }
      if (
        !row.leagueId ||
        !clubBelongsToOperationalLeague(row.leagueId, context.leagueId, context.role)
      ) {
        return { ok: false, error: "El deportista no pertenece a tu liga activa." };
      }
    } else if (
      context.leagueId?.trim() &&
      row.leagueId &&
      !clubBelongsToOperationalLeague(row.leagueId, context.leagueId, context.role)
    ) {
      return { ok: false, error: "El deportista no pertenece a tu liga activa." };
    }

    return { ok: true, leagueId: row.leagueId ?? null };
  }

  const [row] = await db
    .select({
      clubId: categories.clubId,
      leagueId: clubs.leagueId,
    })
    .from(categories)
    .innerJoin(clubs, eq(categories.clubId, clubs.id))
    .where(eq(categories.id, id))
    .limit(1);

  if (!row) return { ok: false, error: "Categoría no encontrada." };

  if (context.role === "CLUB_DELEGATE") {
    if (!context.clubId || context.clubId !== row.clubId) {
      return { ok: false, error: "No puedes emitir validación para esta categoría." };
    }
  } else if (context.role === "LEAGUE_ADMIN") {
    if (!context.leagueId?.trim()) {
      return { ok: false, error: "Selecciona una liga activa antes de emitir validación." };
    }
    if (
      !row.leagueId ||
      !clubBelongsToOperationalLeague(row.leagueId, context.leagueId, context.role)
    ) {
      return { ok: false, error: "La categoría no pertenece a tu liga activa." };
    }
  } else if (
    context.leagueId?.trim() &&
    row.leagueId &&
    !clubBelongsToOperationalLeague(row.leagueId, context.leagueId, context.role)
  ) {
    return { ok: false, error: "La categoría no pertenece a tu liga activa." };
  }

  return { ok: true, leagueId: row.leagueId ?? null };
}

/** URL firmada para QR (solo servidor; requiere sesión intranet). */
export async function getEntityValidationUrlAction(
  entityId: string,
  kind: ValidationEntityKind,
): Promise<EntityValidationUrlResult> {
  const auth = await requireAuth(VALIDATION_URL_ROLES);
  if (auth.denied) return { ok: false, error: auth.error };

  const scope = await assertCanIssueValidationUrl(entityId, kind, auth.context);
  if (!scope.ok) return { ok: false, error: scope.error };

  const url = buildPublicValidationUrl(entityId, kind);
  if (!url) {
    return {
      ok: false,
      error: "No se pudo generar el enlace. Revisa NEXT_PUBLIC_SITE_URL y VALIDATION_TOKEN_SECRET.",
    };
  }

  return { ok: true, url };
}

export type PlayersValidationUrlsResult =
  | { ok: true; urls: Record<string, string> }
  | { ok: false; error: string };

function canIssuePlayerValidationForContext(
  row: { clubId: string; leagueId: string | null },
  context: { role: Role; clubId?: string; leagueId?: string },
): boolean {
  if (context.role === "CLUB_DELEGATE") {
    return Boolean(context.clubId && context.clubId === row.clubId);
  }
  if (context.role === "LEAGUE_ADMIN") {
    if (!context.leagueId?.trim() || !row.leagueId) return false;
    return clubBelongsToOperationalLeague(row.leagueId, context.leagueId, context.role);
  }
  if (context.leagueId?.trim() && row.leagueId) {
    return clubBelongsToOperationalLeague(row.leagueId, context.leagueId, context.role);
  }
  return true;
}

/** URLs `/validar` por jugador en una sola petición (ficha de inscripción). */
export async function getPlayersValidationUrlsAction(
  playerIds: string[],
): Promise<PlayersValidationUrlsResult> {
  const auth = await requireAuth(VALIDATION_URL_ROLES);
  if (auth.denied) return { ok: false, error: auth.error };

  const ids = [...new Set(playerIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return { ok: true, urls: {} };
  }

  const rows = await db
    .select({
      id: players.id,
      clubId: players.clubId,
      leagueId: clubs.leagueId,
    })
    .from(players)
    .innerJoin(clubs, eq(players.clubId, clubs.id))
    .where(inArray(players.id, ids));

  const urls: Record<string, string> = {};
  for (const row of rows) {
    if (!canIssuePlayerValidationForContext(row, auth.context)) continue;
    const url = buildPublicValidationUrl(row.id, "player");
    if (url) urls[row.id] = url;
  }

  if (Object.keys(urls).length === 0) {
    return {
      ok: false,
      error: "No se pudieron generar enlaces de validación para los deportistas solicitados.",
    };
  }

  return { ok: true, urls };
}
