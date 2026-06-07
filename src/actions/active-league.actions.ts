"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isValidLeagueUuid } from "@/lib/auth/active-league";
import { persistActiveLeagueContext } from "@/lib/auth/set-active-league-cookie";
import { leagueRepository } from "@/repositories/league.repository";

export type SetActiveLeagueResult =
  | { success: true }
  | { success: false; error: string };

export async function setActiveLeagueAction(
  leagueId: string | null
): Promise<SetActiveLeagueResult> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autenticado." };
  }

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "SUPER_ADMIN") {
    return { success: false, error: "Solo el super administrador puede cambiar la liga activa." };
  }

  if (leagueId !== null && leagueId !== "" && !isValidLeagueUuid(leagueId)) {
    return { success: false, error: "Identificador de liga no válido." };
  }

  const resolvedId = leagueId && leagueId !== "" ? leagueId : null;
  if (resolvedId && !(await leagueRepository.existsById(resolvedId))) {
    return { success: false, error: "La liga no existe." };
  }

  try {
    await persistActiveLeagueContext(user.id, resolvedId, { deferJwtSync: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo guardar la liga activa.";
    return { success: false, error: message };
  }

  return { success: true };
}
