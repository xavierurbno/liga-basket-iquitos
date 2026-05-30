import { cache } from "react";
import { cookies } from "next/headers";
import { createSupabaseServerFromCookies } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { leagueRepository } from "@/repositories/league.repository";
import {
  resolveOperationalLeagueId,
  needsOperationalLeagueSelection,
} from "@/lib/auth/resolve-league-id";
import type { Role } from "@/lib/auth/withAuth";

export type LigaOperationalContext = {
  user: User;
  role: Role | undefined;
  leagueId: string | null;
  leagueName: string | null;
  /** Slug de la liga operativa (enlaces a `/l/[slug]/`). */
  activeLeagueSlug: string | null;
  needsLeagueSelection: boolean;
  leagues: { id: string; name: string; slug: string }[];
};

export const getLigaOperationalContext = cache(async (): Promise<LigaOperationalContext> => {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerFromCookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.role as Role | undefined;
  const leagueId = resolveOperationalLeagueId(user, cookieStore);
  const needsLeagueSelection = needsOperationalLeagueSelection(role, leagueId);

  const leagues =
    role === "SUPER_ADMIN" ? await leagueRepository.findAll() : [];

  let leagueName: string | null = null;
  let activeLeagueSlug: string | null = null;
  if (leagueId) {
    const fromList = leagues.find((l) => l.id === leagueId);
    if (fromList) {
      leagueName = fromList.name;
      activeLeagueSlug = fromList.slug;
    } else {
      const league = await leagueRepository.findById(leagueId);
      leagueName = league?.name ?? null;
      activeLeagueSlug = league?.slug ?? null;
    }
  }

  return {
    user,
    role,
    leagueId,
    leagueName,
    activeLeagueSlug,
    needsLeagueSelection,
    leagues,
  };
});
