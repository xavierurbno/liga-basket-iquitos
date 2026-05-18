"use server";

import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { ilike } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";

export type ClubDocumental = {
  id: string;
  name: string;
  slug: string;
  federationCode: string | null;
  presidentName: string | null;
  presidentLastname: string | null;
  district: string | null;
};

export type BusquedaClubResult =
  | { ok: true; clubs: ClubDocumental[] }
  | { ok: false; error: string };

const DOCUMENT_SEARCH_ROLES = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"] as const;

export async function buscarClubParaDocumento(
  query: string
): Promise<BusquedaClubResult> {
  const auth = await requireAuth([...DOCUMENT_SEARCH_ROLES]);
  if (auth.denied) return { ok: false, error: auth.error };

  const q = query.trim();
  if (q.length < 2)
    return { ok: false, error: "Ingresa al menos 2 caracteres para buscar." };

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
      })
      .from(clubs)
      .where(ilike(clubs.name, `%${q}%`))
      .limit(10);

    if (rows.length === 0)
      return { ok: false, error: `No se encontraron clubs con "${q}".` };

    return { ok: true, clubs: rows };
  } catch (err) {
    console.error("[buscarClubParaDocumento]", err);
    return { ok: false, error: "Error al consultar la base de datos." };
  }
}
