import { getSupabaseAdmin } from "@/lib/supabase/admin-server";
import { isValidLeagueUuid } from "@/lib/auth/active-league";

/** Espeja la liga activa (cookie) en `app_metadata` para que RLS en Supabase la lea del JWT. */
export async function syncActiveLeagueToJwt(
  userId: string,
  activeLeagueId: string | null,
): Promise<void> {
  if (activeLeagueId !== null && !isValidLeagueUuid(activeLeagueId)) {
    throw new Error("active_league_id no válido para sincronizar JWT.");
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    throw new Error(error?.message ?? "No se pudo leer el usuario en Auth.");
  }

  const prev = { ...((data.user.app_metadata as Record<string, unknown> | undefined) ?? {}) };
  if (activeLeagueId) {
    prev.active_league_id = activeLeagueId;
  } else {
    delete prev.active_league_id;
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: prev,
  });
  if (updErr) {
    throw new Error(updErr.message ?? "No se pudo actualizar active_league_id en JWT.");
  }
}
