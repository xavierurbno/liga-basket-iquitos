import { db } from "@/lib/db/client";
import { players, Player, NewPlayer, PlayerCategory, PlayerStatus } from "@/lib/db/schema";
import { effectiveBypassClubFilter, type ClubScopeOptions } from "@/lib/auth/data-scope";
import { eq, and, count } from "drizzle-orm";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

type DB = typeof db;
type Transaction = PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;

export class PlayerRepository {
  async countByCategory(
    clubId: string,
    category: PlayerCategory,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions
  ) {
    const whereClause = effectiveBypassClubFilter(options)
      ? eq(players.category, category)
      : and(eq(players.clubId, clubId), eq(players.category, category));
    const [{ count: total }] = await tx
      .select({ count: count() })
      .from(players)
      .where(whereClause);
    return Number(total);
  }

  async create(data: NewPlayer, tx: DB | Transaction = db) {
    const [row] = await tx
      .insert(players)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    clubId: string,
    data: Partial<Player>,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions
  ) {
    const whereClause = effectiveBypassClubFilter(options)
      ? eq(players.id, id)
      : and(eq(players.id, id), eq(players.clubId, clubId));
    return await tx
      .update(players)
      .set({ ...data, updatedAt: new Date() })
      .where(whereClause);
  }

  async updateStatus(
    id: string,
    status: PlayerStatus,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions & { clubId?: string }
  ) {
    if (effectiveBypassClubFilter(options)) {
      return await tx
        .update(players)
        .set({ status, updatedAt: new Date() })
        .where(eq(players.id, id));
    }
    const clubId = options?.clubId;
    if (!clubId) {
      throw new Error("updateStatus: se requiere clubId cuando no hay bypass de super admin.");
    }
    return await tx
      .update(players)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(players.id, id), eq(players.clubId, clubId)));
  }

  async delete(
    id: string,
    clubId: string,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions
  ) {
    const whereClause = effectiveBypassClubFilter(options)
      ? eq(players.id, id)
      : and(eq(players.id, id), eq(players.clubId, clubId));
    return await tx.delete(players).where(whereClause);
  }

  async findById(id: string, tx: DB | Transaction = db) {
    const [row] = await tx
      .select()
      .from(players)
      .where(eq(players.id, id))
      .limit(1);
    return row || null;
  }
}

export const playerRepository = new PlayerRepository();
