"use server";

import { z } from "zod";
import { db } from "@/lib/db/client";
import { leagues, leagueSettings } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
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
};

export const createLeagueAction = withAuth(
  async (
    _prevState: CreateLeagueState,
    formData: FormData,
    _user: User,
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

      revalidatePath("/super-admin/leagues");

      return {
        success: true,
        message: "Liga creada correctamente",
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
  async (id: string, _user: User, _context: AuthContext) => {
    try {
      await leagueRepository.delete(id);
      revalidatePath("/super-admin/leagues");
      return { success: true, message: "Liga eliminada correctamente" };
    } catch (error) {
      console.error("[DELETE_LEAGUE_ERROR]", error);
      return { success: false, message: "Error al eliminar la liga" };
    }
  },
  "SUPER_ADMIN"
);
