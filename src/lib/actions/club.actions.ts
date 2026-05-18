"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
import { clubRepository } from "@/repositories/clubRepository";
import { updateClubService } from "@/services/clubService";
import type { ActionResult } from "@/lib/types/league";
import { crearClubSistemaAction } from "@/lib/actions/system-dashboard";

/** Creación de club (intranet staff): alias del action existente en `system-dashboard`. */
export const createClubAction = crearClubSistemaAction;

function asText(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Actualización completa del club (mismo FormData que la creación + `clubId`).
 * Solo SUPER_ADMIN y LEAGUE_ADMIN. LEAGUE_ADMIN solo clubes de su liga.
 */
export const updateClubAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = asText(formData.get("clubId"));
    if (!clubId) {
      return { success: false, error: "Falta el identificador del club." };
    }

    const existing = await clubRepository.findById(clubId);
    if (!existing) {
      return { success: false, error: "Club no encontrado." };
    }

    const actorLeague = context.leagueId?.trim();
    if (context.role === "LEAGUE_ADMIN") {
      if (!actorLeague || existing.leagueId !== actorLeague) {
        return { success: false, error: "No puedes editar clubes fuera de tu liga." };
      }
    }
    if (context.role === "SUPER_ADMIN") {
      if (!actorLeague || existing.leagueId !== actorLeague) {
        return {
          success: false,
          error: "Este club no pertenece a la liga activa. Cambia de liga en la barra superior.",
        };
      }
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll() {},
        },
      },
    );

    return updateClubService(formData, clubId, supabase, existing);
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);
