"use server";

import { unstable_cache } from "next/cache";
import { asc, eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, clubs, players } from "@/lib/db/schema";
import { isValidUuid, sanitizeTsQueryInput } from "@/lib/db/public-read-guards";
import { resolvePublicJugadorImageUrl } from "@/lib/utils/jugador-image-url";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";
import { busqueda365CategoriesCacheTag } from "@/lib/busqueda365/busqueda365-cache";
import { logBusqueda365Query } from "@/lib/observability/pii-access-log";

/** Option del buscador: cada fila en `categories` (category interna al club). */
export type Busqueda365CategoriaOpcion = {
  id: string;
  nombreCategoria: string;
  clubId: string;
  clubName: string;
  clubLogoUrl: string | null;
};

/** Vista de jugador sin datos sensibles (sin DNI ni transactionDate de nacimiento). */
export type Busqueda365JugadorSeguro = {
  id: string;
  imageUrl: string | null;
  fullName: string;
  poloNumber: number | null;
  clubName: string;
  categoryLabel: string;
  status: "ACTIVO" | "SUSPENDIDO" | "INACTIVO" | "PENDIENTE_PAGO";
};

/** Bloque por club: un equipo = plantilla de esa category de club. */
export type Busqueda365ClubBloque = {
  clubId: string;
  clubName: string;
  clubLogoUrl: string | null;
  equipoNombre: string;
  players: Busqueda365JugadorSeguro[];
};

export type ListarCategoriasResult =
  | { success: true; data: Busqueda365CategoriaOpcion[] }
  | { success: false; error: string };

export type ListarPlantillaResult =
  | { success: true; clubs: Busqueda365ClubBloque[] }
  | { success: false; error: string };

function normalizeLeagueId(leagueId: string): string | null {
  const id = leagueId.trim();
  return isValidUuid(id) ? id : null;
}

function getCachedCategoriasForLeague(leagueId: string) {
  const tag = busqueda365CategoriesCacheTag(leagueId);
  return unstable_cache(
    async () => {
      return await db
        .select({
          id: categories.id,
          nombreCategoria: categories.name,
          clubId: clubs.id,
          clubName: clubs.name,
          clubLogoUrl: clubs.logoUrl,
        })
        .from(categories)
        .innerJoin(clubs, eq(categories.clubId, clubs.id))
        .where(eq(clubs.leagueId, leagueId))
        .orderBy(asc(clubs.name), asc(categories.name));
    },
    [`busqueda365-categories`, leagueId],
    {
      revalidate: 86400,
      tags: [tag],
    },
  )();
}

/**
 * Lista categorías de clubes de una sola liga.
 * No expone DNI ni columnas sensibles.
 */
export async function listarCategoriasBusqueda365(
  leagueId: string,
): Promise<ListarCategoriasResult> {
  const rateError = await enforceRateLimit("busqueda365");
  if (rateError) {
    return { success: false, error: rateError };
  }

  const scopedLeagueId = normalizeLeagueId(leagueId);
  if (!scopedLeagueId) {
    return { success: false, error: "Liga no válida." };
  }

  try {
    const rows = await getCachedCategoriasForLeague(scopedLeagueId);

    const data: Busqueda365CategoriaOpcion[] = rows.map((r) => ({
      id: r.id,
      nombreCategoria: r.nombreCategoria,
      clubId: r.clubId,
      clubName: r.clubName,
      clubLogoUrl: resolvePublicJugadorImageUrl(r.clubLogoUrl),
    }));

    await logBusqueda365Query({
      leagueId: scopedLeagueId,
      operation: "list_categories",
      resultCount: data.length,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error al listar categorys en Busqueda365:", error);
    return { success: false, error: "Error de red al conectar con la base de datos." };
  }
}

/**
 * Plantilla filtrada por categoría de club, acotada a una liga.
 */
export async function listarPlantillaPorCategoriaId(
  leagueId: string,
  categoriaClubId: string,
  searchTerm?: string,
): Promise<ListarPlantillaResult> {
  const rateError = await enforceRateLimit("busqueda365");
  if (rateError) {
    return { success: false, error: rateError };
  }

  const scopedLeagueId = normalizeLeagueId(leagueId);
  if (!scopedLeagueId) {
    return { success: false, error: "Liga no válida." };
  }

  const id = categoriaClubId.trim();
  if (!isValidUuid(id)) {
    return { success: false, error: "Identificador de category no valid." };
  }

  try {
    const baseConditions = [eq(categories.id, id), eq(clubs.leagueId, scopedLeagueId)];
    const tsQueryTerm = searchTerm ? sanitizeTsQueryInput(searchTerm) : "";
    if (tsQueryTerm) {
      baseConditions.push(
        sql`to_tsvector('spanish', ${players.name} || ' ' || ${players.lastname}) @@ to_tsquery('spanish', ${tsQueryTerm})`,
      );
    }

    const rows = await db
      .select({
        playerId: players.id,
        name: players.name,
        lastname: players.lastname,
        photoUrl: players.photoUrl,
        jerseyNumber: players.jerseyNumber,
        status: players.status,
        clubId: clubs.id,
        clubName: clubs.name,
        clubLogoUrl: clubs.logoUrl,
        nombreCategoria: categories.name,
      })
      .from(players)
      .innerJoin(categories, eq(players.categoryId, categories.id))
      .innerJoin(clubs, eq(players.clubId, clubs.id))
      .where(and(...baseConditions))
      .orderBy(asc(clubs.name), asc(players.lastname), asc(players.name));

    const byClub = new Map<string, Busqueda365ClubBloque>();

    for (const r of rows) {
      let bloque = byClub.get(r.clubId);
      if (!bloque) {
        bloque = {
          clubId: r.clubId,
          clubName: r.clubName,
          clubLogoUrl: resolvePublicJugadorImageUrl(r.clubLogoUrl),
          equipoNombre: r.nombreCategoria,
          players: [],
        };
        byClub.set(r.clubId, bloque);
      }

      const fullName = `${r.name.trim()} ${r.lastname.trim()}`.replace(/\s+/g, " ").trim();
      bloque.players.push({
        id: r.playerId,
        imageUrl: resolvePublicJugadorImageUrl(r.photoUrl),
        fullName,
        poloNumber: r.jerseyNumber,
        clubName: r.clubName,
        categoryLabel: r.nombreCategoria,
        status: r.status as Busqueda365JugadorSeguro["status"],
      });
    }

    const clubsList = [...byClub.values()].sort((a, b) =>
      a.clubName.localeCompare(b.clubName, "es", { sensitivity: "base" }),
    );

    const playerCount = clubsList.reduce((sum, c) => sum + c.players.length, 0);
    await logBusqueda365Query({
      leagueId: scopedLeagueId,
      operation: "list_roster",
      categoryId: id,
      searchTerm: searchTerm ?? null,
      resultCount: playerCount,
    });

    return { success: true, clubs: clubsList };
  } catch (error) {
    console.error("Error al listar plantilla en Busqueda365:", error);
    return { success: false, error: "Error de red al conectar con la base de datos." };
  }
}
