import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { leagueRepository } from "@/repositories/league.repository";
import { CreateLeagueWizard } from "@/components/admin/CreateLeagueWizard";
import { CopyLeaguePublicLink } from "@/components/admin/CopyLeaguePublicLink";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { withIntranetRead } from "@/lib/db/with-intranet-read";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { userAssignmentRepository } from "@/repositories/userAssignmentRepository";

export default async function LeaguesAdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activeLeagueId = user ? resolveOperationalLeagueId(user, cookieStore) : null;

  const leagues =
    (await withIntranetRead((tx) => leagueRepository.findAllWithSettings(undefined, tx))) ?? [];
  const adminCounts = await Promise.all(
    leagues.map((l) => userAssignmentRepository.countLeagueAdmins(l.id)),
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col items-end gap-4 sm:flex-row sm:justify-end">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              {leagues.length} {leagues.length === 1 ? "liga" : "ligas"}
            </span>
          </div>
          <CreateLeagueWizard />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {leagues.map((league, index) => {
          const adminCount = adminCounts[index] ?? 0;
          const fichaHref = `/super-admin/leagues/${league.id}/`;
          return (
            <article
              key={league.id}
              className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#005CEE]/30 hover:shadow-md"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{league.name}</h2>
                  <p className="mt-1 font-mono text-xs text-slate-400">{leaguePortalHome(league.slug)}</p>
                  {activeLeagueId === league.id ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">
                      Liga activa en el panel operativo
                    </p>
                  ) : null}
                </div>
                <Link
                  href={fichaHref}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#005CEE] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#004bb5]"
                >
                  Ficha
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <dl className="mb-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="font-bold uppercase tracking-wider text-slate-400">Admins</dt>
                  <dd className="mt-0.5 text-lg font-black text-slate-800">{adminCount}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="font-bold uppercase tracking-wider text-slate-400">Temporada</dt>
                  <dd className="mt-0.5 truncate font-semibold text-slate-700">
                    {league.settings?.seasonName ?? "—"}
                  </dd>
                </div>
              </dl>

              <CopyLeaguePublicLink slug={league.slug} leagueName={league.name} />

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link
                  href={leaguePortalHome(league.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-[#005CEE]"
                >
                  Portal
                </Link>
                <span className="text-slate-200">·</span>
                <Link
                  href={fichaHref}
                  className="text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-[#005CEE]"
                >
                  Configurar
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {leagues.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-[2.5rem] border-4 border-dashed border-slate-100 bg-white py-24 text-center">
          <p className="text-xl font-bold text-slate-400">No hay ligas configuradas</p>
          <p className="mt-1 text-sm font-medium text-slate-300">
            Usa «Nueva Liga» para lanzar el asistente de alta.
          </p>
          <CreateLeagueWizard triggerLabel="Crear primera liga" />
        </div>
      )}
    </div>
  );
}
