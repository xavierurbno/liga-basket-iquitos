import { db } from "@/lib/db/client";
import { normativas } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type PublicNormativaListItem = {
  id: string;
  titulo: string;
  urlArchivo: string;
};

export const normativaRepository = {
  /** Documentos visibles en portal público, más recientes primero. */
  async findPublicRecent(limit = 4): Promise<PublicNormativaListItem[]> {
    return await db
      .select({
        id: normativas.id,
        titulo: normativas.titulo,
        urlArchivo: normativas.urlArchivo,
      })
      .from(normativas)
      .where(eq(normativas.esPublico, true))
      .orderBy(desc(normativas.createdAt))
      .limit(limit);
  },
};
