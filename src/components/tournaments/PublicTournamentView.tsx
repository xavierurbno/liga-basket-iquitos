"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarDays, Table2 } from "lucide-react";
import { TournamentStatusBadge } from "@/components/tournaments/TournamentStatusBadge";
import {
  StandingsTeamCell,
  TournamentMatchTeams,
} from "@/components/tournaments/TournamentMatchTeams";
import { tournamentFormatLabel } from "@/lib/tournaments/format-labels";

export type PublicMatchRow = {
  round: number;
  phase: string;
  playoffLabel: string | null;
  homeLabel: string;
  awayLabel: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type PublicStandingRow = {
  groupId: string;
  categoryId: string;
  position: number;
  clubName: string;
  categoryName: string;
  clubLogoUrl?: string | null;
  played: number;
  won: number;
  lost: number;
  points: number;
  pointDiff: number;
};

type Props = {
  tournament: {
    name: string;
    format: string;
    status: string;
    leagueName: string;
  };
  groups: { id: string; name: string }[];
  matches: PublicMatchRow[];
  standings: PublicStandingRow[];
};

const MATCH_STATUS_LABEL: Record<string, string> = {
  scheduled: "Programado",
  postponed: "Aplazado",
  finished: "Finalizado",
  wo_home: "W.O. local",
  wo_away: "W.O. visitante",
};

function matchScoreLine(m: PublicMatchRow): string {
  if (m.status === "finished" && m.homeScore != null && m.awayScore != null) {
    return `${m.homeScore} – ${m.awayScore}`;
  }
  return MATCH_STATUS_LABEL[m.status] ?? m.status;
}

function pickDefaultOpenRound(rounds: number[], matches: PublicMatchRow[]): number | null {
  if (rounds.length === 0) return null;
  const pendingRound = rounds.find((r) =>
    matches.some(
      (m) =>
        m.round === r &&
        m.status !== "finished" &&
        !m.status.startsWith("wo_")
    )
  );
  return pendingRound ?? rounds[rounds.length - 1] ?? null;
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 72;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

function standingRowKey(r: PublicStandingRow, index: number): string {
  return r.categoryId || `${r.groupId}-${index}-${r.clubName}`;
}

function standingRank(r: PublicStandingRow, index: number): number {
  return r.position > 0 ? r.position : index + 1;
}

export function PublicTournamentView({ tournament, groups, matches, standings }: Props) {
  const regularGroups = groups.filter((g) => g.name !== "Play-offs");
  const playoffMatches = matches.filter((m) => m.phase === "playoff");
  const groupMatches = matches.filter((m) => m.phase !== "playoff");

  const hasStandings = regularGroups.some((g) =>
    standings.some((s) => s.groupId === g.id)
  );
  const hasCalendar = groupMatches.length > 0 || playoffMatches.length > 0;

  return (
    <div className="pb-24 md:pb-10">
      <header className="rounded-2xl border border-[#BFDBFE] bg-linear-to-br from-[#EFF6FF] to-white p-5 sm:p-6">
        <p className="text-sm font-semibold text-[#1B3A6B]">{tournament.leagueName}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black text-[#005CEE] sm:text-3xl">{tournament.name}</h1>
          <TournamentStatusBadge status={tournament.status} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {tournamentFormatLabel(tournament.format)}
        </p>
      </header>

      <PublicTournamentQuickNav hasCalendar={hasCalendar} hasStandings={hasStandings} />

      {hasCalendar && (
        <section id="calendario" className="scroll-mt-28 mt-8">
          <SectionHeading
            title="Calendario y resultados"
            subtitle="Marcadores por jornada. Toca una jornada para expandir o contraer."
          />
          {groupMatches.length > 0 && (
            <PublicFixtureMatchList
              matches={groupMatches}
              roundLabel={(r) => `Jornada ${r}`}
            />
          )}
          {playoffMatches.length > 0 && (
            <div className={groupMatches.length > 0 ? "mt-8" : ""}>
              <h3 className="mb-3 text-base font-bold text-[#0f2040]">Play-offs</h3>
              <PublicFixtureMatchList
                matches={playoffMatches}
                roundLabel={(r) => `Ronda ${r - 100}`}
              />
            </div>
          )}
        </section>
      )}

      {hasStandings && (
        <section id="tabla" className="scroll-mt-28 mt-10">
          <SectionHeading title="Tabla de posiciones" />
          {regularGroups.map((g) => {
            const rows = standings
              .filter((s) => s.groupId === g.id)
              .sort((a, b) => {
                if (a.position > 0 && b.position > 0) return a.position - b.position;
                if (a.position > 0) return -1;
                if (b.position > 0) return 1;
                return a.clubName.localeCompare(b.clubName, "es", { sensitivity: "base" });
              });
            if (rows.length === 0) return null;
            return (
              <div key={g.id} className="mb-8 last:mb-0">
                <h3 className="mb-3 text-base font-bold text-[#0f2040]">{g.name}</h3>
                <StandingsTable rows={rows} />
              </div>
            );
          })}
        </section>
      )}

      {!hasCalendar && !hasStandings && (
        <p className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          El fixture se publicará cuando esté disponible.
        </p>
      )}
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-[#0f2040]">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function PublicTournamentQuickNav({
  hasCalendar,
  hasStandings,
}: {
  hasCalendar: boolean;
  hasStandings: boolean;
}) {
  const items = useMemo(() => {
    const list: { id: string; label: string; icon: typeof CalendarDays }[] = [];
    if (hasCalendar) list.push({ id: "calendario", label: "Calendario", icon: CalendarDays });
    if (hasStandings) list.push({ id: "tabla", label: "Tabla", icon: Table2 });
    return list;
  }, [hasCalendar, hasStandings]);

  if (items.length === 0) return null;

  const NavButton = ({
    id,
    label,
    icon: Icon,
    className,
  }: {
    id: string;
    label: string;
    icon: typeof CalendarDays;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={() => scrollToSection(id)}
      className={className}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );

  return (
    <>
      <nav
        className="sticky top-0 z-30 mt-6 hidden gap-2 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur md:flex"
        aria-label="Accesos del campeonato"
      >
        {items.map((item) => (
          <NavButton
            key={item.id}
            {...item}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#1B3A6B] transition hover:bg-[#EFF6FF]"
          />
        ))}
      </nav>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
        aria-label="Accesos del campeonato"
      >
        {items.map((item) => (
          <NavButton
            key={item.id}
            {...item}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[11px] font-semibold text-[#1B3A6B]"
          />
        ))}
      </nav>
    </>
  );
}

function PublicFixtureMatchList({
  matches,
  roundLabel,
}: {
  matches: PublicMatchRow[];
  roundLabel: (round: number) => string;
}) {
  const rounds = useMemo(
    () => [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b),
    [matches]
  );
  const defaultOpen = useMemo(
    () => pickDefaultOpenRound(rounds, matches),
    [rounds, matches]
  );
  const [openRounds, setOpenRounds] = useState<Set<number>>(() =>
    defaultOpen != null ? new Set([defaultOpen]) : new Set()
  );

  const toggleRound = useCallback((round: number) => {
    setOpenRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  }, []);

  if (rounds.length === 0) return null;

  return (
    <div className="space-y-2">
      {rounds.map((round) => {
        const open = openRounds.has(round);
        const roundMatches = matches.filter((m) => m.round === round);
        return (
          <div
            key={round}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <button
              type="button"
              onClick={() => toggleRound(round)}
              className="flex w-full items-center justify-between gap-2 bg-slate-50 px-4 py-3 text-left"
              aria-expanded={open}
            >
              <span className="text-sm font-bold text-[#0f2040]">{roundLabel(round)}</span>
              <span className="text-xs text-slate-500">
                {roundMatches.length} partido{roundMatches.length === 1 ? "" : "s"} ·{" "}
                {open ? "Ocultar" : "Ver"}
              </span>
            </button>
            {open && (
              <ul className="divide-y divide-slate-100 p-2">
                {roundMatches.map((m) => (
                  <li key={`${m.round}-${m.homeLabel}-${m.awayLabel}`}>
                    <MatchCard match={m} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MatchCard({ match: m }: { match: PublicMatchRow }) {
  const score = matchScoreLine(m);
  const isFinished = m.status === "finished" || m.status.startsWith("wo_");

  return (
    <article className="rounded-lg px-3 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        {m.playoffLabel && (
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
            {m.playoffLabel}
          </p>
        )}
        <TournamentMatchTeams
          homeLabel={m.homeLabel}
          awayLabel={m.awayLabel}
          homeLogoUrl={m.homeLogoUrl}
          awayLogoUrl={m.awayLogoUrl}
          className="text-sm leading-snug"
        />
      </div>
      <p
        className={`mt-2 shrink-0 text-right sm:mt-0 ${
          isFinished
            ? "text-lg font-black tabular-nums text-[#005CEE]"
            : "text-xs font-medium text-slate-500"
        }`}
      >
        {score}
      </p>
    </article>
  );
}

function StandingsTable({ rows }: { rows: PublicStandingRow[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Equipo</th>
              <th className="px-3 py-2 text-center">PJ</th>
              <th className="px-3 py-2 text-center">PG</th>
              <th className="px-3 py-2 text-center">PP</th>
              <th className="px-3 py-2 text-center">+/-</th>
              <th className="px-3 py-2 text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, index) => (
              <tr key={standingRowKey(r, index)} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold">{standingRank(r, index)}</td>
                <td className="px-3 py-2">
                  <StandingsTeamCell
                    clubName={r.clubName}
                    categoryName={r.categoryName}
                    clubLogoUrl={r.clubLogoUrl}
                  />
                </td>
                <td className="px-3 py-2 text-center">{r.played}</td>
                <td className="px-3 py-2 text-center">{r.won}</td>
                <td className="px-3 py-2 text-center">{r.lost}</td>
                <td className="px-3 py-2 text-center">{r.pointDiff}</td>
                <td className="px-3 py-2 text-center font-bold">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 md:hidden">
        {rows.map((r, index) => (
          <li
            key={standingRowKey(r, index)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-sm font-bold text-[#1B3A6B]">
              {standingRank(r, index)}
            </span>
            <div className="min-w-0 flex-1">
              <StandingsTeamCell
                clubName={r.clubName}
                categoryName={r.categoryName}
                clubLogoUrl={r.clubLogoUrl}
              />
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="font-bold text-[#1B3A6B]">{r.points} pts</p>
              <p>
                {r.won}G · {r.lost}P · {r.pointDiff >= 0 ? "+" : ""}
                {r.pointDiff}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
