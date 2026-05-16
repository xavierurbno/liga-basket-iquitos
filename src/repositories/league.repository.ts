import { db } from "@/lib/db/client";
import { leagues, leagueSettings } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

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

  async delete(id: string) {
    return await db.delete(leagues).where(eq(leagues.id, id));
  }
}

export const leagueRepository = new LeagueRepository();
