"use server";

import { after } from "next/server";
import { z } from "zod";
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
import { createLeagueCore } from "@/lib/leagues/create-league-core";
import { provisionLeagueAdmin } from "@/lib/leagues/provision-league-admin";
import { revalidateLeaguePortalBySlug } from "@/lib/portal/revalidate-league-portal";
import type { NewLeagueKind } from "@/lib/leagues/resolve-new-league-settings-defaults";

const createLeagueSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  slug: z.string().min(3, "El slug debe tener al menos 3 caracteres").max(50).regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
});

const createLeagueWizardSchema = createLeagueSchema.extend({
  seasonName: z.string().max(120).optional(),
  leagueKind: z.enum(["federated", "tournament"]).optional(),
  assignAdmin: z.enum(["true", "false"]).optional(),
  adminFullName: z.string().max(120).optional(),
  adminEmail: z.string().max(255).optional(),
});

export type CreateLeagueState = {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  /** Liga recién creada; la acción ya la dejó como liga activa en cookie. */
  leagueId?: string;
};

export const createLeagueWizardAction = withAuth(
  async (
    _prevState: CreateLeagueState,
    formData: FormData,
    user: User,
    _context: AuthContext,
  ): Promise<CreateLeagueState> => {
    const assignAdmin = formData.get("assignAdmin") === "true";
    const raw = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      seasonName: formData.get("seasonName") || undefined,
      leagueKind: (formData.get("leagueKind") as NewLeagueKind | null) || undefined,
      assignAdmin: assignAdmin ? "true" : "false",
      adminFullName: formData.get("adminFullName") || undefined,
      adminEmail: formData.get("adminEmail") || undefined,
    };

    const validated = createLeagueWizardSchema.safeParse(raw);
    if (!validated.success) {
      return {
        success: false,
        message: "Error de validación",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    if (assignAdmin) {
      const name = validated.data.adminFullName?.trim() ?? "";
      const email = validated.data.adminEmail?.trim() ?? "";
      if (name.length < 3 || !email) {
        return {
          success: false,
          message: "Indica nombre y correo Gmail del administrador de liga.",
          errors: {
            adminFullName: name.length < 3 ? ["Mínimo 3 caracteres"] : undefined,
            adminEmail: !email ? ["Correo obligatorio"] : undefined,
          } as Record<string, string[]>,
        };
      }
    }

    try {
      const seasonName =
        validated.data.seasonName?.trim() ||
        `Temporada ${new Date().getFullYear()}`;

      const created = await createLeagueCore({
        name: validated.data.name,
        slug: validated.data.slug,
        seasonName,
        leagueKind: validated.data.leagueKind ?? "tournament",
        planTier: "free",
      });

      if (!created.success) {
        if (created.code === "duplicate_slug") {
          return { success: false, message: "El slug ya está en uso por otra liga." };
        }
        return { success: false, message: created.error };
      }

      const newLeague = { id: created.leagueId, slug: created.slug };

      let adminMessage = "";
      if (assignAdmin && validated.data.adminFullName && validated.data.adminEmail) {
        const adminPayload = {
          leagueId: newLeague.id,
          fullName: validated.data.adminFullName.trim(),
          email: validated.data.adminEmail.trim(),
        };
        after(async () => {
          try {
            const adminResult = await provisionLeagueAdmin(adminPayload);
            if (adminResult.success) {
              revalidatePath("/liga/perfiles/");
              revalidatePath(`/super-admin/leagues/${newLeague.id}`);
            } else {
              console.error("[CREATE_LEAGUE_ADMIN_DEFERRED]", adminResult.error);
            }
          } catch (err) {
            console.error("[CREATE_LEAGUE_ADMIN_DEFERRED]", err);
          }
        });
        adminMessage =
          " La invitación al administrador se está procesando; revisa la ficha de la liga en unos segundos.";
      }

      await persistActiveLeagueContext(user.id, newLeague.id);
      revalidatePath("/");
      revalidatePath("/ligas");
      revalidatePath("/super-admin/leagues");
      revalidatePath(`/super-admin/leagues/${newLeague.id}`);
      revalidateActiveLeaguePaths();
      revalidateLeaguePortalBySlug(newLeague.slug);

      return {
        success: true,
        message: `Liga creada y seleccionada como activa.${adminMessage}`,
        leagueId: newLeague.id,
      };
    } catch (error: unknown) {
      console.error("[CREATE_LEAGUE_WIZARD_ERROR]", error);
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
  "SUPER_ADMIN",
);

export type ProvisionLeagueAdminFormState = {
  success?: boolean;
  message?: string;
  error?: string;
};

export const provisionLeagueAdminFromFichaAction = withAuth(
  async (
    _prev: ProvisionLeagueAdminFormState,
    formData: FormData,
    _user: User,
    _context: AuthContext,
  ): Promise<ProvisionLeagueAdminFormState> => {
    const leagueId = (formData.get("leagueId") as string | null)?.trim();
    const fullName = (formData.get("adminFullName") as string | null)?.trim() ?? "";
    const email = (formData.get("adminEmail") as string | null)?.trim() ?? "";

    if (!leagueId) {
      return { success: false, error: "Liga no indicada." };
    }

    const result = await provisionLeagueAdmin({ leagueId, fullName, email });
    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/super-admin/leagues");
    revalidatePath(`/super-admin/leagues/${leagueId}`);
    revalidatePath("/liga/perfiles/");

    const detail =
      result.invited
        ? "Se envió la invitación por correo."
        : result.created
          ? "Administrador creado."
          : "Administrador vinculado a la liga.";

    return { success: true, message: detail };
  },
  "SUPER_ADMIN",
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
      revalidatePath(`/super-admin/leagues/${id}`);
      return { success: true, message: "Liga eliminada correctamente" };
    } catch (error) {
      console.error("[DELETE_LEAGUE_ERROR]", error);
      const pgCode =
        error &&
        typeof error === "object" &&
        "cause" in error &&
        error.cause &&
        typeof error.cause === "object" &&
        "code" in error.cause
          ? String((error.cause as { code: string }).code)
          : null;
      if (pgCode === "23503") {
        return {
          success: false,
          error:
            "No se pudo eliminar la liga: aún hay registros vinculados. Elimina clubes y torneos primero o contacta soporte.",
        };
      }
      return { success: false, error: "Error al eliminar la liga" };
    }
  },
  "SUPER_ADMIN"
);
