"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { normativas } from "@/lib/db/schema";
import { isValidUuid } from "@/lib/db/public-read-guards";
import { isMissingNormativasRelation } from "@/lib/normativas/normativas-db-error";
import { isAllowedInstitutionalAssetUrl } from "@/lib/security/allowed-fetch-url";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";

export type PublicNormativaDownloadResult =
  | { ok: true; url: string; title: string }
  | { ok: false; error: string };

/**
 * Resuelve la URL de descarga tras comprobar que el documento es público.
 */
export async function getPublicNormativaDownloadUrl(
  documentId: string
): Promise<PublicNormativaDownloadResult> {
  const rateError = await enforceRateLimit("normativas");
  if (rateError) return { ok: false, error: rateError };

  if (!documentId || typeof documentId !== "string" || !isValidUuid(documentId)) {
    return { ok: false, error: "Identificador no válido" };
  }

  try {
    const rows = await db
      .select({
        id: normativas.id,
        titulo: normativas.titulo,
        urlArchivo: normativas.urlArchivo,
        esPublico: normativas.esPublico,
      })
      .from(normativas)
      .where(and(eq(normativas.id, documentId), eq(normativas.esPublico, true)))
      .limit(1);

    const row = rows[0];
    if (!row?.urlArchivo) {
      return { ok: false, error: "Documento no disponible" };
    }

    if (!isAllowedInstitutionalAssetUrl(row.urlArchivo)) {
      return { ok: false, error: "Enlace de documento no permitido." };
    }

    return { ok: true, url: row.urlArchivo, title: row.titulo };
  } catch (e) {
    if (isMissingNormativasRelation(e)) {
      return {
        ok: false,
        error:
          "La base de datos aún no tiene la tabla normativas. Ejecuta supabase/migrations/0011_normativas_table.sql en Supabase.",
      };
    }
    throw e;
  }
}
