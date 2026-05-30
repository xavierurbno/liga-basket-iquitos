import { db } from "@/lib/db/client";
import { normativas } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type PublicNormativaListItem = {
  id: string;
  titulo: string;
  urlArchivo: string;
};

export const normativaRepository = {
  /** Documentos públicos de una liga, más recientes primero. */
  async findPublicByLeagueId(
    leagueId: string,
    limit?: number,
  ): Promise<PublicNormativaListItem[]> {
    const q = db
      .select({
        id: normativas.id,
        titulo: normativas.titulo,
        urlArchivo: normativas.urlArchivo,
      })
      .from(normativas)
      .where(and(eq(normativas.leagueId, leagueId), eq(normativas.esPublico, true)))
      .orderBy(desc(normativas.createdAt));

    if (limit != null) {
      return q.limit(limit);
    }
    return q;
  },
};
