import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userAssignments } from "@/lib/db/schema";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";

type AppMeta = Record<string, unknown>;

function stripTenantKeys(meta: AppMeta): AppMeta {
  const next = { ...meta };
  delete next.club_id;
  delete next.club_slug;
  delete next.clubId;
  delete next.clubSlug;
  return next;
}

export type LinkLeagueOwnerResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Vincula al usuario autenticado como LEAGUE_ADMIN de la liga (self-service Fase 6).
 */
export async function linkUserAsLeagueAdmin(input: {
  userId: string;
  leagueId: string;
  fullName?: string;
}): Promise<LinkLeagueOwnerResult> {
  const admin = getSupabaseAdmin();
  const metaPayload: AppMeta = {
    role: "LEAGUE_ADMIN",
    league_id: input.leagueId,
  };

  try {
    const [alreadyAdmin] = await db
      .select({ userId: userAssignments.userId })
      .from(userAssignments)
      .where(
        and(
          eq(userAssignments.userId, input.userId),
          eq(userAssignments.leagueId, input.leagueId),
          eq(userAssignments.role, "LEAGUE_ADMIN"),
          isNull(userAssignments.clubId),
        ),
      )
      .limit(1);

    if (!alreadyAdmin) {
      await db.insert(userAssignments).values({
        userId: input.userId,
        leagueId: input.leagueId,
        clubId: null,
        role: "LEAGUE_ADMIN",
      });
    }

    const { data: userRow, error: getErr } = await admin.auth.admin.getUserById(input.userId);
    if (getErr || !userRow?.user) {
      return { success: false, error: getErr?.message ?? "No se pudo leer el usuario." };
    }

    const prevUserMeta = (userRow.user.user_metadata as Record<string, unknown> | undefined) ?? {};
    const prevApp = (userRow.user.app_metadata as AppMeta | undefined) ?? {};
    const fullName = input.fullName?.trim();

    const { error: updErr } = await admin.auth.admin.updateUserById(input.userId, {
      user_metadata: fullName ? { ...prevUserMeta, full_name: fullName } : prevUserMeta,
      app_metadata: { ...stripTenantKeys(prevApp), ...metaPayload },
    });
    if (updErr) {
      return { success: false, error: updErr.message ?? "No se pudo asignar el rol." };
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al vincular administrador.";
    return { success: false, error: msg };
  }
}
