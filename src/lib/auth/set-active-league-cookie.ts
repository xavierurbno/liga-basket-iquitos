import { after } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACTIVE_LEAGUE_COOKIE } from "@/lib/auth/active-league";
import { syncActiveLeagueToJwt } from "@/lib/auth/sync-active-league-jwt";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Persiste la liga operativa del super admin (httpOnly). */
export async function writeActiveLeagueCookie(leagueId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_LEAGUE_COOKIE, leagueId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearActiveLeagueCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_LEAGUE_COOKIE);
}

export function revalidateActiveLeaguePaths(): void {
  revalidatePath("/liga", "layout");
  revalidatePath("/super-admin/leagues");
  revalidatePath("/dashboard");
}

type PersistActiveLeagueOptions = {
  /** Solo cookie; el JWT se sincroniza en segundo plano (cambio de liga en UI). */
  deferJwtSync?: boolean;
};

/** Cookie httpOnly + `app_metadata.active_league_id` en JWT (para RLS con supabase-js). */
export async function persistActiveLeagueContext(
  userId: string,
  leagueId: string | null,
  options?: PersistActiveLeagueOptions,
): Promise<void> {
  if (leagueId) {
    await writeActiveLeagueCookie(leagueId);
  } else {
    await clearActiveLeagueCookie();
  }

  if (options?.deferJwtSync) {
    after(() => {
      void syncActiveLeagueToJwt(userId, leagueId).catch((err) => {
        console.error("[SYNC_ACTIVE_LEAGUE_JWT_DEFERRED]", err);
      });
    });
    return;
  }

  await syncActiveLeagueToJwt(userId, leagueId);
}
