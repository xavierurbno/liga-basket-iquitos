import { redirect } from "next/navigation";
import { leagueRepository } from "@/repositories/league.repository";
import { sponsorRepository } from "@/repositories/sponsorRepository";
import { SponsorManagerClient } from "@/components/admin/SponsorManagerClient";
import { isDashboardSuperAdmin } from "@/lib/auth/dashboard-super-admin";
import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { SelectActiveLeaguePrompt } from "@/components/liga/SelectActiveLeaguePrompt";
import type { AuthContext } from "@/lib/auth/withAuth";
import { withOperationalRead } from "@/lib/db/operational-db-access";

export default async function LigaPatrocinadoresPage() {
  const ctx = await getLigaOperationalContext();
  const superLike = isDashboardSuperAdmin(ctx.user);
  const allowed =
    ctx.role === "SUPER_ADMIN" || ctx.role === "LEAGUE_ADMIN" || superLike;
  if (!allowed) redirect("/liga/");

  if (ctx.needsLeagueSelection) {
    return (
      <SelectActiveLeaguePrompt
        role={ctx.role}
        leagues={ctx.leagues}
        activeLeagueId={ctx.leagueId}
        title="Selecciona una liga para patrocinadores"
        description="Gestiona los logos del pie del portal para una liga concreta."
      />
    );
  }

  const authContext: AuthContext = {
    userId: ctx.user.id,
    role: ctx.role!,
    clubId: ctx.user.app_metadata?.club_id as string | undefined,
    leagueId: ctx.leagueId ?? (ctx.user.app_metadata?.league_id as string | undefined),
  };

  const league = await withOperationalRead(ctx.user, authContext, (tx) =>
    leagueRepository.findById(ctx.leagueId!, tx),
  );
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
