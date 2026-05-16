import { db } from "@/lib/db/client";
import { categories, Category, NewCategory } from "@/lib/db/schema";
import { effectiveBypassClubFilter, type ClubScopeOptions } from "@/lib/auth/data-scope";
import { eq } from "drizzle-orm";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

type DB = typeof db;
type Transaction = PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;

export class CategoryRepository {
  /**
   * Categorías de un club. Bypass de `clubId` solo si `actingRole === SUPER_ADMIN` y `bypassClubFilter`.
   */
  async findAllByClub(
    clubId: string,
    tx: DB | Transaction = db,
    options?: ClubScopeOptions
  ) {
    if (effectiveBypassClubFilter(options)) {
      return await tx.select().from(categories);
    }
    return await tx
      .select()
      .from(categories)
      .where(eq(categories.clubId, clubId));
  }

  async findById(id: string, tx: DB | Transaction = db) {
    const [row] = await tx
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return row || null;
  }

  async create(data: NewCategory, tx: DB | Transaction = db) {
    const [row] = await tx
      .insert(categories)
      .values(data)
      .returning();
    return row;
  }

  async update(id: string, data: Partial<Category>, tx: DB | Transaction = db) {
    return await tx
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id));
  }

  async delete(id: string, tx: DB | Transaction = db) {
    return await tx.delete(categories).where(eq(categories.id, id));
  }
}

export const categoryRepository = new CategoryRepository();
