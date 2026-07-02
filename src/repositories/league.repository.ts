import {
  operationalReadDb,
  operationalWriteDb,
  type OperationalDb,
  type OperationalTx,
} from "@/lib/db/operational-db-access";
import {
  getPlatformDefaultLeagueId,
  getPlatformDefaultLeagueSlug,
} from "@/lib/platform/platform-config";
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
import { asc, desc, eq } from "drizzle-orm";

type DB = OperationalDb;
type Transaction = OperationalTx;

export class LeagueRepository {
  /**
   * Obtiene todas las ligas registradas junto con su configuración (settings).
   * Refactorizado a leftJoin para evitar lateral joins pesados y timeouts.
   */
  async findAllWithSettings(
    params?: { limit?: number; offset?: number },
    tx: DB | Transaction = operationalReadDb(),
  ) {
    const results = await tx
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
  async findAll(tx: DB | Transaction = operationalReadDb()) {
    return await tx
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
      })
      .from(leagues)
      .orderBy(desc(leagues.createdAt));
  }

  async existsById(id: string, tx: DB | Transaction = operationalReadDb()): Promise<boolean> {
    const [row] = await tx
      .select({ id: leagues.id })
      .from(leagues)
      .where(eq(leagues.id, id))
      .limit(1);
    return Boolean(row);
  }

  /**
   * Busca una liga por su ID incluyendo su configuración.
   */
  async findById(id: string, tx: DB | Transaction = operationalReadDb()) {
    const results = await tx
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
  async findBySlug(slug: string, tx: DB | Transaction = operationalReadDb()) {
    const results = await tx
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
   * Liga por defecto para redirecciones legadas y contexto sin slug.
   * 1. PLATFORM_DEFAULT_LEAGUE_SLUG
   * 2. NEXT_PUBLIC_DEFAULT_LEAGUE_ID
   * 3. Primera liga por createdAt
   */
  async findDefaultForPortal(tx: DB | Transaction = operationalReadDb()) {
    const envSlug = getPlatformDefaultLeagueSlug();
    if (envSlug) {
      const row = await this.findBySlug(envSlug, tx);
      if (row) return row;
    }

    const envId = getPlatformDefaultLeagueId();
    if (envId) {
      const row = await this.findById(envId, tx);
      if (row) {
        return { id: row.id, name: row.name, slug: row.slug };
      }
    }

    const [oldest] = await tx
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
  async delete(id: string, tx: DB | Transaction = operationalWriteDb()) {
    return tx.transaction(async (innerTx) => {
      await innerTx.delete(tournaments).where(eq(tournaments.leagueId, id));
      await innerTx.delete(clubs).where(eq(clubs.leagueId, id));
      await innerTx.delete(players).where(eq(players.leagueId, id));
      await innerTx.delete(categories).where(eq(categories.leagueId, id));
      await innerTx.delete(treasury).where(eq(treasury.leagueId, id));
      await innerTx.delete(userAssignments).where(eq(userAssignments.leagueId, id));
      await innerTx.delete(galleryPhotos).where(eq(galleryPhotos.leagueId, id));
      await innerTx.delete(sponsors).where(eq(sponsors.leagueId, id));
      await innerTx.delete(normativas).where(eq(normativas.leagueId, id));
      await innerTx.delete(leagueSettings).where(eq(leagueSettings.leagueId, id));
      return innerTx.delete(leagues).where(eq(leagues.id, id));
    });
  }
}

export const leagueRepository = new LeagueRepository();
