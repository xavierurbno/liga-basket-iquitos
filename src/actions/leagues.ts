"use server";

import { z } from "zod";
import { db } from "@/lib/db/client";
import { leagues, leagueSettings } from "@/lib/db/schema";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveLeagueIdFromCookies } from "@/lib/auth/active-league";
import type { User } from "@supabase/supabase-js";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
import {
  persistActiveLeagueContext,
  revalidateActiveLeaguePaths,
} from "@/lib/auth/set-active-league-cookie";
import { leagueRepository } from "@/repositories/league.repository";

const createLeagueSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  slug: z.string().min(3, "El slug debe tener al menos 3 caracteres").max(50).regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
});

export type CreateLeagueState = {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  /** Liga recién creada; la acción ya la dejó como liga activa en cookie. */
  leagueId?: string;
};

export const createLeagueAction = withAuth(
  async (
    _prevState: CreateLeagueState,
    formData: FormData,
    user: User,
    _context: AuthContext,
  ): Promise<CreateLeagueState> => {
    const rawData = {
      name: formData.get("name"),
      slug: formData.get("slug"),
    };

    const validated = createLeagueSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        message: "Error de validación",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    try {
      // 1. Crear la liga
      const [newLeague] = await db.insert(leagues).values({
        name: validated.data.name,
        slug: validated.data.slug,
      }).returning();

      // 2. Crear settings por defecto para la liga
      await db.insert(leagueSettings).values({
        leagueId: newLeague.id,
        seasonName: `Temporada ${new Date().getFullYear()}`,
      });

      await persistActiveLeagueContext(user.id, newLeague.id);
      revalidatePath("/super-admin/leagues");
      revalidateActiveLeaguePaths();

      return {
        success: true,
        message: "Liga creada y seleccionada como liga activa",
        leagueId: newLeague.id,
      };
    } catch (error: unknown) {
      console.error("[CREATE_LEAGUE_ERROR]", error);
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : undefined;
      if (code === "23505") {
        return {
          success: false,
          message: "El slug ya está en uso por otra liga.",
        };
      }
      return {
        success: false,
        message: "Error inesperado al crear la liga.",
      };
    }
  },
  "SUPER_ADMIN"
);

export const deleteLeagueAction = withAuth(
  async (id: string, user: User, _context: AuthContext) => {
    try {
      const cookieStore = await cookies();
      const activeId = getActiveLeagueIdFromCookies(cookieStore);
      await leagueRepository.delete(id);
      if (activeId === id) {
        await persistActiveLeagueContext(user.id, null);
        revalidateActiveLeaguePaths();
      }
      revalidatePath("/super-admin/leagues");
      return { success: true, message: "Liga eliminada correctamente" };
    } catch (error) {
      console.error("[DELETE_LEAGUE_ERROR]", error);
      return { success: false, message: "Error al eliminar la liga" };
    }
  },
  "SUPER_ADMIN"
);
