"use server";

import { db } from "@/lib/db/client";
import { players, clubs, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { buildDocumentPlayerSearchConditions } from "@/lib/auth/document-search-scope";
import { logDocumentSearchByPlayer } from "@/lib/observability/pii-access-log";
import { resolvePlayerPhotoUrl } from "@/lib/storage/player-photo-url.server";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";

// ─────────────────────────────────────────────────────────────
// TIPOS DE RETORNO
// ─────────────────────────────────────────────────────────────

export type JugadorDocumental = {
  id: string;
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  /** Categoría enum almacenada en BD */
  category: string;
  /** Nombre legible de la categoría del club (ej: "SUB-15 VARONES") */
  categoriaNombre: string | null;
  /** Nombre del club al que pertenece */
  clubName: string;
  /** URL pública de la foto desde Supabase Storage */
  photoUrl: string | null;
  /** Fecha de nacimiento ISO */
  fechaNacimientoIso: string;
  /** Número de ficha asignado por la liga */
  carnetNumber: string | null;
  /** Liga del club (logo en PDF) */
  leagueId: string | null;
};

export type BusquedaResult =
  | { ok: true; jugador: JugadorDocumental }
  | { ok: false; error: string };

// ─────────────────────────────────────────────────────────────
// SERVER ACTION PRINCIPAL
// Búsqueda acotada por liga operativa (LEAGUE_ADMIN / super-admin con liga activa).
// ─────────────────────────────────────────────────────────────

export const buscarJugadorPorDocumento = withAuth(
  async (
    documentType: string,
    documentNumber: string,
    user: User,
    context: AuthContext
  ): Promise<BusquedaResult> => {
    const rateError = await enforceRateLimit("documentos");
    if (rateError) return { ok: false, error: rateError };

    const docNumFmt = documentNumber.trim();
    if (!docNumFmt) {
      return { ok: false, error: "El número de documento es obligatorio." };
    }

    const whereClause = buildDocumentPlayerSearchConditions(
      documentType,
      docNumFmt,
      context,
    );
    if (typeof whereClause === "object" && "error" in whereClause) {
      return { ok: false, error: whereClause.error };
    }

    try {
      const rows = await db
        .select({
          id: players.id,
          name: players.name,
          lastname: players.lastname,
          documentType: players.documentType,
          documentNumber: players.documentNumber,
          category: players.category,
          birthdate: players.birthdate,
          fotoUrlRaw: players.photoUrl,
          carnetNumber: players.carnetNumber,
          clubName: clubs.name,
          categoriaNombre: categories.name,
          leagueId: clubs.leagueId,
        })
        .from(players)
        .innerJoin(clubs, eq(players.clubId, clubs.id))
        .leftJoin(categories, eq(players.categoryId, categories.id))
        .where(whereClause)
        .orderBy(desc(players.createdAt))
        .limit(1);

      if (rows.length === 0) {
        await logDocumentSearchByPlayer({
          userId: user.id,
          role: context.role,
          leagueId: context.leagueId,
          documentType,
          documentNumber: docNumFmt,
          found: false,
        });
        return {
          ok: false,
          error: `No se encontró ningún jugador con el documento indicado (${documentType}) en tu liga.`,
        };
      }

      const row = rows[0];

      const photoUrl = await resolvePlayerPhotoUrl(row.fotoUrlRaw, { intent: "intranet" });

      const jugadorDocumental: JugadorDocumental = {
        id: row.id,
        name: row.name,
        lastname: row.lastname,
        documentType: row.documentType,
        documentNumber: row.documentNumber,
        category: row.category,
        categoriaNombre: row.categoriaNombre ?? null,
        clubName: row.clubName ?? "Club no especificado",
        photoUrl,
        fechaNacimientoIso: row.birthdate?.toISOString() ?? "",
        carnetNumber: row.carnetNumber ?? null,
        leagueId: row.leagueId ?? null,
      };

      await logDocumentSearchByPlayer({
        userId: user.id,
        role: context.role,
        leagueId: row.leagueId ?? context.leagueId,
        documentType,
        documentNumber: docNumFmt,
        found: true,
        playerId: row.id,
      });

      return { ok: true, jugador: jugadorDocumental };
    } catch (err) {
      console.error("[buscarJugadorPorDni] Error:", err);
      return {
        ok: false,
        error: "Error al consultar la base de datos. Inténtelo nuevamente.",
      };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);
