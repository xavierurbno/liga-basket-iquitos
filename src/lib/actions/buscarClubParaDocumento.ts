"use server";

import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { buildDocumentClubSearchConditions } from "@/lib/auth/document-search-scope";
import { requireAuth } from "@/lib/auth/require-auth";
import { logDocumentClubSearch } from "@/lib/observability/pii-access-log";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";

export type ClubDocumental = {
  id: string;
  name: string;
  slug: string;
  federationCode: string | null;
  presidentName: string | null;
  presidentLastname: string | null;
  district: string | null;
  leagueId: string | null;
};

export type BusquedaClubResult =
  | { ok: true; clubs: ClubDocumental[] }
  | { ok: false; error: string };

const DOCUMENT_SEARCH_ROLES = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"] as const;

export async function buscarClubParaDocumento(
  query: string
): Promise<BusquedaClubResult> {
  const rateError = await enforceRateLimit("documentos");
  if (rateError) return { ok: false, error: rateError };

  const auth = await requireAuth([...DOCUMENT_SEARCH_ROLES]);
  if (auth.denied) return { ok: false, error: auth.error };

  const q = query.trim();
  if (q.length < 2)
    return { ok: false, error: "Ingresa al menos 2 caracteres para buscar." };

  const whereClause = buildDocumentClubSearchConditions(q, auth.context);
  if (!whereClause) {
    if (auth.context.role === "CLUB_DELEGATE") {
      return { ok: false, error: "Tu cuenta no tiene un club asignado para buscar documentos." };
    }
    if (auth.context.role === "LEAGUE_ADMIN") {
      return { ok: false, error: "Selecciona una liga activa antes de buscar clubes." };
    }
    return { ok: false, error: "No tienes contexto de liga para buscar clubes." };
  }

  try {
    const rows = await db
      .select({
        id: clubs.id,
        name: clubs.name,
        slug: clubs.slug,
        federationCode: clubs.federationCode,
        presidentName: clubs.presidentName,
        presidentLastname: clubs.presidentLastname,
        district: clubs.district,
        leagueId: clubs.leagueId,
      })
      .from(clubs)
      .where(whereClause)
      .limit(10);

    if (rows.length === 0) {
      await logDocumentClubSearch({
        userId: auth.user.id,
        role: auth.context.role,
        leagueId: auth.context.leagueId,
        query: q,
        resultCount: 0,
      });
      return { ok: false, error: "No se encontraron clubes con ese criterio de búsqueda." };
    }

    await logDocumentClubSearch({
      userId: auth.user.id,
      role: auth.context.role,
      leagueId: auth.context.leagueId,
      query: q,
      resultCount: rows.length,
    });

    return { ok: true, clubs: rows };
  } catch (err) {
    console.error("[buscarClubParaDocumento]", err);
    return { ok: false, error: "Error al consultar la base de datos." };
  }
}
