import { db } from "@/lib/db/client";
import { clubs, clubMembers, Club, NewClub } from "@/lib/db/schema";
import { effectiveBypassClubFilter, type ClubScopeOptions } from "@/lib/auth/data-scope";
import { eq } from "drizzle-orm";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

type DB = typeof db;
type Transaction = PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;

export class ClubRepository {
  /**
   * Busca un club por su slug exacto.
   */
  async findBySlug(slug: string, tx: DB | Transaction = db) {
    const [row] = await tx
      .select()
      .from(clubs)
      .where(eq(clubs.slug, slug))
      .limit(1);
    return row || null;
  }

  /**
   * Verifica si un slug existe.
   */
  async existsBySlug(slug: string, tx: DB | Transaction = db): Promise<boolean> {
    const [row] = await tx
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.slug, slug))
      .limit(1);
    return Boolean(row);
  }

  /**
   * Inserta un nuevo club. Soporta transacciones opcionales.
   */
  async create(data: NewClub, tx: DB | Transaction = db) {
    const [row] = await tx
      .insert(clubs)
      .values(data)
      .returning();
    return row;
  }

  /**
   * Agrega un miembro a un club.
   */
  async addMember(data: { userId: string; clubId: string; role: string; active?: boolean }, tx: DB | Transaction = db) {
    return await tx.insert(clubMembers).values(data);
  }

  /**
   * Actualiza los datos de un club.
   */
  async update(id: string, data: Partial<Club>, tx: DB | Transaction = db) {
    return await tx
      .update(clubs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clubs.id, id));
  }

  /**
   * Elimina un club por ID.
   */
  async delete(id: string, tx: DB | Transaction = db) {
    return await tx.delete(clubs).where(eq(clubs.id, id));
  }

  /**
   * Obtiene un club por su ID.
   */
  async findById(id: string, tx: DB | Transaction = db) {
    const [row] = await tx
      .select()
      .from(clubs)
      .where(eq(clubs.id, id))
      .limit(1);
    return row || null;
  }

  /**
   * Clubes pertenecientes a una liga (intranet LEAGUE_ADMIN).
   */
  async findByLeagueId(leagueId: string, tx: DB | Transaction = db) {
    return await tx
      .select()
      .from(clubs)
      .where(eq(clubs.leagueId, leagueId));
  }

  /**
   * Obtiene todos los clubes registrados.
   */
  async getAll(tx: DB | Transaction = db) {
    return await tx.select().from(clubs);
  }

  /**
   * Listado de clubes con alcance: SUPER_ADMIN + `{ bypassClubFilter: true }` → todos;
   * resto con `leagueId` → solo esa liga; sin bypass ni liga → ninguno (evita filtrar mal).
   */
  async findAllScoped(
    options: ClubScopeOptions & { leagueId?: string | null },
    tx: DB | Transaction = db
  ) {
    if (effectiveBypassClubFilter(options)) {
      return await tx.select().from(clubs);
    }
    const lid = options.leagueId;
    if (lid) {
      return await this.findByLeagueId(lid, tx);
    }
    return [];
  }
}

export const clubRepository = new ClubRepository();
