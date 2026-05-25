import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { authUsers, userAssignments } from "@/lib/db/schema";
import { inviteStaffUserByEmail } from "@/lib/auth/staff-invite";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";
import { leagueRepository } from "@/repositories/league.repository";

const adminSchema = z.object({
  fullName: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
  email: z.string().trim().email("Correo inválido"),
});

type AppMeta = Record<string, unknown>;

function stripTenantKeys(meta: AppMeta): AppMeta {
  const next = { ...meta };
  delete next.club_id;
  delete next.club_slug;
  delete next.clubId;
  delete next.clubSlug;
  return next;
}

export type ProvisionLeagueAdminResult =
  | { success: true; userId: string; created: boolean; invited?: boolean }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Crea o actualiza un LEAGUE_ADMIN vinculado a `leagueId` (sin asignar SUPER_ADMIN).
 * Usuarios nuevos reciben invitación por correo (Supabase Invite).
 */
export async function provisionLeagueAdmin(input: {
  leagueId: string;
  fullName: string;
  email: string;
}): Promise<ProvisionLeagueAdminResult> {
  const parsed = adminSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Datos del administrador inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { fullName, email } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const admin = getSupabaseAdmin();
  const metaPayload: AppMeta = {
    role: "LEAGUE_ADMIN",
    league_id: input.leagueId,
  };

  const leagueRow = await leagueRepository.findById(input.leagueId);
  const leagueSlug = leagueRow?.slug ?? null;

  try {
    const [existing] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.email, emailNorm))
      .limit(1);

    let userId: string;
    let created = false;
    let invited = false;

    if (existing?.id) {
      userId = existing.id;

      const [alreadyAdmin] = await db
        .select({ userId: userAssignments.userId })
        .from(userAssignments)
        .where(
          and(
            eq(userAssignments.userId, userId),
            eq(userAssignments.leagueId, input.leagueId),
            eq(userAssignments.role, "LEAGUE_ADMIN"),
            isNull(userAssignments.clubId),
          ),
        )
        .limit(1);

      if (alreadyAdmin) {
        return { success: true, userId, created: false };
      }

      const { data: userRow, error: getErr } = await admin.auth.admin.getUserById(userId);
      if (getErr || !userRow?.user) {
        return { success: false, error: getErr?.message ?? "No se pudo leer el usuario en Auth." };
      }
      const prevUserMeta = (userRow.user.user_metadata as Record<string, unknown> | undefined) ?? {};
      const prevApp = (userRow.user.app_metadata as AppMeta | undefined) ?? {};
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: { ...prevUserMeta, full_name: fullName },
        app_metadata: { ...stripTenantKeys(prevApp), ...metaPayload },
      });
      if (updErr) {
        return { success: false, error: updErr.message ?? "No se pudo actualizar el usuario." };
      }

      await db.insert(userAssignments).values({
        userId,
        leagueId: input.leagueId,
        clubId: null,
        role: "LEAGUE_ADMIN",
      });
    } else {
      const invitedResult = await inviteStaffUserByEmail(admin, {
        email: emailNorm,
        fullName,
        appMetadata: metaPayload,
        leagueSlug,
      });
      if (!invitedResult.ok) {
        return { success: false, error: invitedResult.error };
      }
      userId = invitedResult.userId;
      created = true;
      invited = true;
      await db.insert(userAssignments).values({
        userId,
        leagueId: input.leagueId,
        clubId: null,
        role: "LEAGUE_ADMIN",
      });
    }

    return { success: true, userId, created, invited };
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: unknown }).code)
        : undefined;
    if (code === "23505") {
      return {
        success: false,
        error: "Este usuario ya tiene una asignación para esta liga o un rol incompatible.",
      };
    }
    const msg = e instanceof Error ? e.message : "Error al asignar administrador.";
    return { success: false, error: msg };
  }
}
