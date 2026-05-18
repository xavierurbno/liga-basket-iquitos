import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasIntranetAccess, type IntranetRole } from "@/lib/auth/intranet-roles";
import { IntranetChrome } from "@/components/intranet/IntranetChrome";
import { clubRepository } from "@/repositories/clubRepository";
import { leagueRepository } from "@/repositories/league.repository";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";

export const dynamic = "force-dynamic";

/** Ruta explícita `/dashboard` para que no la capture `/{clubSlug}` (p. ej. slug "dashboard"). */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const roleRaw = user.app_metadata?.role as string | undefined;
  if (!hasIntranetAccess(roleRaw)) {
    redirect("/acceso-pendiente");
  }

  const role = roleRaw as IntranetRole;
  const meta = user.app_metadata as { club_id?: string; league_id?: string };

  let clubName: string | null = null;
  let clubSlug: string | null = null;
  let clubId: string | null = null;
  let leagueName: string | null = null;
  let leagues: { id: string; name: string; slug: string }[] | undefined;
  let clubs: { id: string; name: string; slug: string }[] | undefined;
  let leagueClubs: { id: string; name: string; slug: string }[] | undefined;

  if (role === "CLUB_DELEGATE" && meta.club_id) {
    clubId = meta.club_id;
    const club = await clubRepository.findById(meta.club_id);
    clubName = club?.name ?? null;
    clubSlug = club?.slug ?? null;
  }

  if (role === "LEAGUE_ADMIN" && meta.league_id) {
    const league = await leagueRepository.findById(meta.league_id);
    leagueName = league?.name ?? null;
    const inLeague = await clubRepository.findAllScoped({
      actingRole: "LEAGUE_ADMIN",
      leagueId: meta.league_id,
    });
    leagueClubs = inLeague.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  }

  let activeLeagueId: string | null = null;
  let activeLeagueName: string | null = null;

  if (role === "SUPER_ADMIN") {
    activeLeagueId = resolveOperationalLeagueId(user, cookieStore);
    const [lRows, cRows] = await Promise.all([
      leagueRepository.findAll(),
      clubRepository.findAllScoped({ bypassClubFilter: true, actingRole: "SUPER_ADMIN" }),
    ]);
    leagues = lRows.map((l) => ({ id: l.id, name: l.name, slug: l.slug }));
    const scopedClubs = activeLeagueId
      ? cRows.filter((c) => c.leagueId === activeLeagueId)
      : [];
    clubs = scopedClubs.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
    if (activeLeagueId) {
      const active = lRows.find((l) => l.id === activeLeagueId);
      activeLeagueName = active?.name ?? null;
    }
  }

  return (
    <IntranetChrome
      role={role}
      userEmail={user.email ?? null}
      clubName={clubName}
      clubSlug={clubSlug}
      clubId={clubId}
      leagueName={leagueName}
      leagues={leagues}
      clubs={clubs}
      leagueClubs={leagueClubs}
      activeLeagueId={activeLeagueId}
      activeLeagueName={activeLeagueName}
    >
      {children}
    </IntranetChrome>
  );
}
