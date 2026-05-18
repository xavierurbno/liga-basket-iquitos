import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import type { PublicTournamentListItem } from "@/lib/tournaments/queries";
import { tournamentFormatLabel } from "@/lib/tournaments/format-labels";
import { TournamentStatusBadge } from "@/components/tournaments/TournamentStatusBadge";

type Props = {
  tournaments: PublicTournamentListItem[];
};

export function PublicTournamentsSection({ tournaments }: Props) {
  return (
    <section
      id="campeonatos"
      className="mt-8 scroll-mt-24"
      aria-labelledby="campeonatos-heading"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1B3A6B]">
            Competiciones
          </p>
          <h2 id="campeonatos-heading" className="mt-1 text-2xl font-black text-[#0f2040]">
            Campeonatos
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Calendario, resultados y tabla de posiciones de los torneos en curso.
          </p>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center">
          <Trophy className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-slate-700">Próximamente</p>
          <p className="mt-1 text-xs text-slate-500">
            No hay campeonatos publicados en este momento. Vuelve más adelante para ver fixture y
            resultados.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <li key={t.id}>
              <Link
                href={`/torneos/${t.leagueSlug}/${t.slug}/`}
                className="group flex h-full flex-col rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.45)] transition hover:border-[#1B3A6B] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3A6B]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1B3A6B] transition group-hover:bg-[#1B3A6B] group-hover:text-white">
                    <Trophy className="h-5 w-5" aria-hidden />
                  </span>
                  <TournamentStatusBadge status={t.status} />
                </div>
                <h3 className="mt-4 text-lg font-bold leading-snug text-[#0f2040] group-hover:text-[#1B3A6B]">
                  {t.name}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{tournamentFormatLabel(t.format)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1B3A6B]">
                  Ver campeonato
                  <ChevronRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
