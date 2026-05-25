"use server";

import { db } from "@/lib/db/client";
import { players, clubs, categories } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createClient, User } from "@supabase/supabase-js";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";

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
// HELPER: generar URL pública del bucket jugador-fotos
// Usa el cliente anon (solo lectura pública).
// ─────────────────────────────────────────────────────────────

function getPublicFotoUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;

  // Si ya es una URL absoluta, devolverla tal cual
  if (storagePath.startsWith("http")) return storagePath;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = supabase.storage
      .from("jugador-fotos")
      .getPublicUrl(storagePath);
    return data?.publicUrl ?? null;
  } catch {
    return null;
  }
}


// ─────────────────────────────────────────────────────────────
// SERVER ACTION PRINCIPAL
// Busca en TODOS los clubs (cross-club) para Gestión Documental.
// Devuelve la afiliación más reciente del deportista.
// ─────────────────────────────────────────────────────────────

export const buscarJugadorPorDocumento = withAuth(
  async (
    documentType: string,
    documentNumber: string,
    user: User,
    context: AuthContext
  ): Promise<BusquedaResult> => {
    const docNumFmt = documentNumber.trim();
    if (!docNumFmt) {
      return { ok: false, error: "El número de documento es obligatorio." };
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
        .leftJoin(clubs, eq(players.clubId, clubs.id))
        .leftJoin(categories, eq(players.categoryId, categories.id))
        .where(
          and(
            eq(players.documentType, documentType as any),
            eq(players.documentNumber, docNumFmt)
          )
        )
        // Más reciente primero — garantiza afiliación vigente
        .orderBy(desc(players.createdAt))
        .limit(1);

      if (rows.length === 0) {
        return {
          ok: false,
          error: `No se encontró ningún jugador con ${documentType} ${docNumFmt}.`,
        };
      }

      const row = rows[0];

      const photoUrl = getPublicFotoUrl(row.fotoUrlRaw);

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
