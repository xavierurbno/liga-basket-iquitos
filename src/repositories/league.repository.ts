import { db } from "@/lib/db/client";
import { PRIMARY_PORTAL_LEAGUE_SLUGS } from "@/lib/portal/portal-league-constants";
import {
  categories,
  clubs,
  galleryPhotos,
  leagues,
  leagueSettings,
  normativas,
  players,
  sponsors,
  tournaments,
  treasury,
  userAssignments,
} from "@/lib/db/schema";
import { asc, desc, eq, ilike, or } from "drizzle-orm";

export { PRIMARY_PORTAL_LEAGUE_SLUGS };

export class LeagueRepository {
  /**
   * Obtiene todas las ligas registradas junto con su configuración (settings).
   * Refactorizado a leftJoin para evitar lateral joins pesados y timeouts.
   */
  async findAllWithSettings(params?: { limit?: number; offset?: number }) {
    const results = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
        createdAt: leagues.createdAt,
        settings: leagueSettings,
      })
      .from(leagues)
      .leftJoin(leagueSettings, eq(leagues.id, leagueSettings.leagueId))
      .orderBy(desc(leagues.createdAt))
      .limit(params?.limit ?? 100)
      .offset(params?.offset ?? 0);

    return results;
  }

  /**
   * Obtiene la lista simplificada de todas las ligas (id y nombre).
   */
  async findAll() {
    return await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
      })
      .from(leagues)
      .orderBy(desc(leagues.createdAt));
  }

  /**
   * Busca una liga por su ID incluyendo su configuración.
   */
  async findById(id: string) {
    const results = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
        createdAt: leagues.createdAt,
        settings: leagueSettings,
      })
      .from(leagues)
      .where(eq(leagues.id, id))
      .leftJoin(leagueSettings, eq(leagues.id, leagueSettings.leagueId))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Busca una liga por su slug.
   */
  async findBySlug(slug: string) {
    const results = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
      })
      .from(leagues)
      .where(eq(leagues.slug, slug))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Liga de la portada `/` (Iquitos / LDDBI). No usar la liga creada más reciente.
   */
  async findDefaultForPortal() {
    for (const slug of PRIMARY_PORTAL_LEAGUE_SLUGS) {
      const row = await this.findBySlug(slug);
      if (row) return row;
    }

    const envId = process.env.NEXT_PUBLIC_DEFAULT_LEAGUE_ID?.trim();
    if (envId) {
      const row = await this.findById(envId);
      if (row) {
        return { id: row.id, name: row.name, slug: row.slug };
      }
    }

    const [byName] = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
      })
      .from(leagues)
      .where(
        or(
          ilike(leagues.name, "%iquitos%"),
          ilike(leagues.name, "%LDDBI%"),
          ilike(leagues.name, "%distrital de basket de iquitos%"),
        ),
      )
      .orderBy(asc(leagues.createdAt))
      .limit(1);

    if (byName) return byName;

    const [oldest] = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
      })
      .from(leagues)
      .orderBy(asc(leagues.createdAt))
      .limit(1);

    return oldest ?? null;
  }

  /**
   * Elimina la liga y datos asociados. Borra en orden explícito porque en producción
   * `clubs.league_id` puede no tener ON DELETE CASCADE (clubs_league_id_fkey).
   */
  async delete(id: string) {
    return db.transaction(async (tx) => {
      await tx.delete(tournaments).where(eq(tournaments.leagueId, id));
      await tx.delete(clubs).where(eq(clubs.leagueId, id));
      await tx.delete(players).where(eq(players.leagueId, id));
      await tx.delete(categories).where(eq(categories.leagueId, id));
      await tx.delete(treasury).where(eq(treasury.leagueId, id));
      await tx.delete(userAssignments).where(eq(userAssignments.leagueId, id));
      await tx.delete(galleryPhotos).where(eq(galleryPhotos.leagueId, id));
      await tx.delete(sponsors).where(eq(sponsors.leagueId, id));
      await tx.delete(normativas).where(eq(normativas.leagueId, id));
      await tx.delete(leagueSettings).where(eq(leagueSettings.leagueId, id));
      return tx.delete(leagues).where(eq(leagues.id, id));
    });
  }
}

export const leagueRepository = new LeagueRepository();
