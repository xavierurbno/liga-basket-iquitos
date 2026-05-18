import { canManageTournaments } from "@/lib/auth/resolve-league-id";
import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { QueryTimeoutError } from "@/lib/db/query-timeout";
import { listTournamentsByLeague } from "@/lib/tournaments/queries";
import { loadTournamentHubBundle } from "@/lib/tournaments/load-tournament-hub";
import {
  parseTournamentHubVista,
  type TournamentHubVista,
} from "@/lib/tournaments/tournament-hub-params";
import { TorneosModuleCard } from "@/components/tournaments/TorneosModuleCard";
import {
  TournamentHubPanels,
  TorneosListItem,
} from "@/components/tournaments/TournamentHubPanels";
import { SelectActiveLeaguePrompt } from "@/components/liga/SelectActiveLeaguePrompt";

const FORMAT_SHORT: Record<string, string> = {
  linear: "Una rueda",
  home_and_away: "Ida y vuelta",
  groups: "Fase de grupos",
  groups_playoffs: "Grupos + play-offs",
};

export default async function LigaTorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ torneo?: string; vista?: string }>;
}) {
  const sp = await searchParams;
  const selectedTournamentId = sp.torneo?.trim() || null;
  const vista: TournamentHubVista = parseTournamentHubVista(sp.vista);

  const ctx = await getLigaOperationalContext();
  const manage = canManageTournaments(ctx.role);

  const alertCls =
    "rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900";

  if (ctx.needsLeagueSelection) {
    return (
      <SelectActiveLeaguePrompt
        role={ctx.role}
        leagues={ctx.leagues}
        activeLeagueId={ctx.leagueId}
        title="Selecciona una liga para ver torneos"
        description={
          ctx.role === "SUPER_ADMIN"
            ? "Elige la liga en la que quieres gestionar torneos, fixture y resultados."
            : undefined
        }
      />
    );
  }

  const leagueId = ctx.leagueId!;

  let items: Awaited<ReturnType<typeof listTournamentsByLeague>> = [];
  try {
    items = await listTournamentsByLeague(leagueId);
  } catch (err) {
    if (err instanceof QueryTimeoutError) {
      return (
        <div className={alertCls}>
          La base de datos tardó demasiado en responder. Reinicia{" "}
          <code className="rounded bg-amber-100 px-1">npm run dev</code>, cierra pestañas
          duplicadas de localhost:3001 e intenta de nuevo.
        </div>
      );
    }
    return (
      <div className={alertCls}>
        Aplica las migraciones de torneos (
        <code className="rounded bg-amber-100 px-1">0013</code>–
        <code className="rounded bg-amber-100 px-1">0016</code> o{" "}
        <code className="rounded bg-amber-100 px-1">APPLY_TOURNAMENTOS_COMPLETO.sql</code>) en
        Supabase.
      </div>
    );
  }

  let hubBundle: Awaited<ReturnType<typeof loadTournamentHubBundle>> = null;
  if (selectedTournamentId) {
    hubBundle = await loadTournamentHubBundle(selectedTournamentId, leagueId);
  }

  return (
    <div className="space-y-6">
      <TorneosModuleCard leagueName={ctx.leagueName} canCreate={manage} />

      {selectedTournamentId && !hubBundle ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          El torneo seleccionado no existe o no pertenece a esta liga. Elige otro de la lista.
        </p>
      ) : null}

      {hubBundle ? (
        <TournamentHubPanels
          vista={vista}
          canManage={manage}
          leagueSlug={hubBundle.leagueSlug}
          isPublicFixture={hubBundle.isPublicFixture}
          pendingGroupMatches={hubBundle.pendingGroupMatches}
          participants={hubBundle.participants}
          tournament={hubBundle.tournament}
          groups={hubBundle.groups}
          matches={hubBundle.matches}
          standings={hubBundle.standings}
        />
      ) : null}

      <section id="lista-torneos" className="scroll-mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Torneos de la liga
        </h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            Sin torneos registrados. Usa <strong>Crear torneo</strong> arriba.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((t) => (
              <TorneosListItem
                key={t.id}
                id={t.id}
                name={t.name}
                formatLabel={FORMAT_SHORT[t.format] ?? t.format}
                status={t.status}
                selected={selectedTournamentId === t.id}
                canManage={manage}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
