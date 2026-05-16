import { db } from "@/lib/db/client";
import { sponsors, NewSponsor } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const sponsorRepository = {
  async findByLeague(leagueId: string) {
    return await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.leagueId, leagueId))
      .orderBy(asc(sponsors.category), asc(sponsors.displayOrder));
  },

  /** Todos los patrocinadores (vista global, p. ej. SUPER_ADMIN). */
  async findAll() {
    return await db
      .select()
      .from(sponsors)
      .orderBy(asc(sponsors.category), asc(sponsors.displayOrder));
  },

  async findById(id: string) {
    const [row] = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.id, id))
      .limit(1);
    return row;
  },

  async create(data: NewSponsor) {
    const [row] = await db.insert(sponsors).values(data).returning();
    return row;
  },

  async update(id: string, data: Partial<NewSponsor>) {
    const [row] = await db
      .update(sponsors)
      .set(data)
      .where(eq(sponsors.id, id))
      .returning();
    return row;
  },

  async createMany(data: NewSponsor[]) {
    return await db.insert(sponsors).values(data).returning();
  },

  async delete(id: string) {
    await db.delete(sponsors).where(eq(sponsors.id, id));
  },
};
