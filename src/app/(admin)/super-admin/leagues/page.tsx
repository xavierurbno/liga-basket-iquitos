import { leagueRepository } from "@/repositories/league.repository";
import { LeagueSettingsForm } from "@/components/admin/LeagueSettingsForm";
import { CreateLeagueModal } from "@/components/admin/CreateLeagueModal";
import { DeleteLeagueButton } from "@/components/admin/DeleteLeagueButton";
import { ManageLeagueButton } from "@/components/liga/ManageLeagueButton";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function LeaguesAdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activeLeagueId = user ? resolveOperationalLeagueId(user, cookieStore) : null;

  const leagues = await leagueRepository.findAllWithSettings();

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 sm:text-5xl">
            Control de <span className="italic text-blue-600">Ligas</span>
          </h1>
          <p className="max-w-2xl font-semibold leading-snug text-slate-500">
            Crea ligas, configura temporadas y abre el panel operativo con un clic.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              {leagues.length} {leagues.length === 1 ? "liga" : "ligas"}
            </span>
          </div>
          <CreateLeagueModal />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-16">
        {leagues.map((league) => (
          <section key={league.id} className="group relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 rounded-full bg-linear-to-b from-blue-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{league.name}</h2>
                {activeLeagueId === league.id ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-600">
                    Liga activa en el panel operativo
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ManageLeagueButton leagueId={league.id} />
                <DeleteLeagueButton leagueId={league.id} leagueName={league.name} />
              </div>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                ID: {league.id.slice(0, 8)}…
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <LeagueSettingsForm
              leagueId={league.id}
              leagueName={league.name}
              initialSettings={league.settings}
            />
          </section>
        ))}

        {leagues.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-[2.5rem] border-4 border-dashed border-slate-100 bg-white py-24 text-center">
            <p className="text-xl font-bold text-slate-400">No hay ligas configuradas</p>
            <p className="mt-1 text-sm font-medium text-slate-300">
              Usa «Nueva Liga» para crear la primera y entrar al panel operativo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
