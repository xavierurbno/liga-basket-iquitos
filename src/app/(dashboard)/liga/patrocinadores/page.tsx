import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { leagueRepository } from "@/repositories/league.repository";
import { sponsorRepository } from "@/repositories/sponsorRepository";
import { SponsorManagerClient } from "@/components/admin/SponsorManagerClient";
import { isDashboardSuperAdmin } from "@/lib/auth/dashboard-super-admin";

export const dynamic = "force-dynamic";

export default async function LigaPatrocinadoresPage() {
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

  const role = user.app_metadata?.role as string | undefined;
  const superLike = isDashboardSuperAdmin(user);
  const allowed = role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN" || superLike;
  if (!allowed) redirect("/liga/");

  const meta = user.app_metadata as { league_id?: string };

  if (role === "LEAGUE_ADMIN" && meta.league_id) {
    const league = await leagueRepository.findById(meta.league_id);
    if (!league) redirect("/liga/");
    const sponsors = await sponsorRepository.findByLeague(league.id);
    const leagueMap = { [league.id]: league.name };
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black text-[#0f2040]">Patrocinadores</h1>
          <p className="mt-1 text-sm text-slate-600">
            Logos visibles en el pie del portal para la liga <strong>{league.name}</strong>.
          </p>
        </header>
        <SponsorManagerClient
          leagues={[{ id: league.id, name: league.name }]}
          initialSponsors={sponsors}
          leagueMap={leagueMap}
        />
      </div>
    );
  }

  const leagues = await leagueRepository.findAll();
  const allSponsors = await Promise.all(
    leagues.map((l) => sponsorRepository.findByLeague(l.id))
  ).then((r) => r.flat());
  const leagueMap = Object.fromEntries(leagues.map((l) => [l.id, l.name]));
  const leagueOptions = leagues.map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-[#0f2040]">Patrocinadores</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gestión global de auspiciadores para todas las ligas. Los cambios se reflejan en el footer del portal
          público.
        </p>
      </header>
      <SponsorManagerClient leagues={leagueOptions} initialSponsors={allSponsors} leagueMap={leagueMap} />
    </div>
  );
}
