import { db, normativas } from "@/lib/db/client";
import { and, desc, eq } from "drizzle-orm";
import type { Normativa } from "@/lib/db/schema";
import type { NormativasLoadResult } from "@/components/normativas/NormativasPublicSection";
import { isMissingNormativasRelation } from "@/lib/normativas/normativas-db-error";

export async function loadPublicNormativasForLeague(
  leagueId: string,
): Promise<NormativasLoadResult> {
  try {
    const docs = await db
      .select()
      .from(normativas)
      .where(and(eq(normativas.leagueId, leagueId), eq(normativas.esPublico, true)))
      .orderBy(desc(normativas.createdAt));
    return { kind: "list", docs };
  } catch (err) {
    if (isMissingNormativasRelation(err)) {
      return { kind: "migration" };
    }
    console.error("[normativas] consulta pública por liga:", err);
    return {
      kind: "error",
      message:
        "No se pudo cargar la lista de normativas. Comprueba la conexión a la base de datos o vuelve a intentar más tarde.",
    };
  }
}
