"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  finishTournament,
  generatePlayoffBracket,
  publishTournament,
  setTournamentPublicFixture,
} from "@/lib/actions/tournaments";
import {
  CalendarTab,
  ConfigTab,
  GroupFilterBar,
  PhaseToggleBar,
  ResultsTab,
  StandingsTab,
  TeamsTab,
  TournamentDetailHeader,
  type TournamentGroupTab,
  type TournamentMatchRow,
} from "@/components/tournaments/TournamentDetailView";
import { TournamentStatusBadge } from "@/components/tournaments/TournamentStatusBadge";
import {
  parseTournamentHubVista,
  tournamentHubHref,
  type TournamentHubVista,
} from "@/lib/tournaments/tournament-hub-params";

const PLAYOFF_GROUP_NAME = "Play-offs";

const VISTA_TABS: { key: TournamentHubVista; label: string; manageOnly?: boolean }[] = [
  { key: "calendario", label: "Calendario" },
  { key: "resultados", label: "Resultados" },
  { key: "tabla", label: "Tabla" },
  { key: "equipos", label: "Equipos" },
  { key: "config", label: "Configuración", manageOnly: true },
];

type TournamentHubPanelsProps = {
  vista: TournamentHubVista;
  canManage: boolean;
  leagueSlug: string;
  isPublicFixture: boolean;
  pendingGroupMatches: number;
  participants: {
    categoryId: string;
    categoryName: string;
    clubName: string;
    groupId?: string;
  }[];
  tournament: {
    id: string;
    slug: string;
    name: string;
    format: string;
    status: string;
    settings: {
      rulesNote?: string;
      numberOfGroups?: number;
      playoffsGenerated?: boolean;
      teamsPerGroupToAdvance?: number;
      useQuarters?: boolean;
    } | null;
  };
  groups: TournamentGroupTab[];
  matches: (TournamentMatchRow & { groupId?: string })[];
  standings: {
    groupId?: string;
    position: number;
    clubName: string;
    categoryName: string;
    clubLogoUrl?: string | null;
    played: number;
    won: number;
    lost: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDiff: number;
    points: number;
  }[];
};

export function TournamentHubPanels({
  vista,
  canManage,
  leagueSlug,
  isPublicFixture,
  pendingGroupMatches,
  participants,
  tournament,
  groups,
  matches,
  standings,
}: TournamentHubPanelsProps) {
  const router = useRouter();
  const activeVista = parseTournamentHubVista(vista);
  const [calendarPhase, setCalendarPhase] = useState<"group" | "playoff">("group");
  const [busy, setBusy] = useState(false);

  const regularGroups = groups.filter((g) => g.name !== PLAYOFF_GROUP_NAME);
  const isPlayoffsFormat = tournament.format === "groups_playoffs";
  const playoffsGenerated = tournament.settings?.playoffsGenerated === true;
  const useQuarters = tournament.settings?.useQuarters === true;
  const multiGroup = regularGroups.length > 1;
  const [activeGroupId, setActiveGroupId] = useState(regularGroups[0]?.id ?? "");

  const groupMatches = matches.filter((m) => m.phase !== "playoff");
  const playoffMatches = matches.filter((m) => m.phase === "playoff");

  const filteredMatches =
    calendarPhase === "playoff"
      ? playoffMatches
      : multiGroup
        ? groupMatches.filter((m) => m.groupId === activeGroupId)
        : groupMatches;

  const filteredStandings = multiGroup
    ? standings.filter((s) => s.groupId === activeGroupId)
    : standings;

  const filteredParticipants = multiGroup
    ? participants.filter((p) => p.groupId === activeGroupId)
    : participants;

  const rounds = [...new Set(filteredMatches.map((m) => m.round))].sort((a, b) => a - b);

  const showGroupBar =
    multiGroup &&
    calendarPhase === "group" &&
    (activeVista === "calendario" ||
      activeVista === "resultados" ||
      activeVista === "tabla" ||
      activeVista === "equipos");

  const visibleTabs = VISTA_TABS.filter((t) => !t.manageOnly || canManage);

  const publish = async () => {
    setBusy(true);
    const res = await publishTournament(tournament.id);
    setBusy(false);
    if (!res.success) toast.error(res.error);
    else {
      toast.success("Torneo iniciado");
      router.refresh();
    }
  };

  const generatePlayoffs = async () => {
    setBusy(true);
    const res = await generatePlayoffBracket(tournament.id);
    setBusy(false);
    if (!res.success) toast.error(res.error);
    else {
      toast.success("Llave de play-offs generada");
      setCalendarPhase("playoff");
      router.refresh();
    }
  };

  const finish = async () => {
    setBusy(true);
    const res = await finishTournament(tournament.id);
    setBusy(false);
    if (!res.success) toast.error(res.error);
    else {
      toast.success("Torneo finalizado");
      router.refresh();
    }
  };

  return (
    <section className="rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.55)] sm:p-6">
      <TournamentDetailHeader tournament={tournament} />

      <nav
        className="mt-5 flex flex-wrap gap-1 border-b border-slate-200"
        aria-label="Vistas del torneo"
      >
        {visibleTabs.map(({ key, label }) => (
          <Link
            key={key}
            href={tournamentHubHref(tournament.id, key)}
            className={`px-4 py-2 text-sm font-semibold ${
              activeVista === key
                ? "border-b-2 border-[#1B3A6B] text-[#1B3A6B]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {isPlayoffsFormat && activeVista === "calendario" && (
        <PhaseToggleBar
          phase={calendarPhase}
          playoffsReady={playoffsGenerated}
          onPhase={setCalendarPhase}
        />
      )}

      {showGroupBar && (
        <GroupFilterBar
          groups={regularGroups}
          activeGroupId={activeGroupId}
          onSelect={setActiveGroupId}
        />
      )}

      {activeVista === "calendario" && (
        <CalendarTab
          rounds={rounds}
          matches={filteredMatches}
          isPlayoffView={calendarPhase === "playoff"}
          useQuarters={useQuarters}
          canManage={canManage}
          tournamentStatus={tournament.status}
        />
      )}

      {activeVista === "resultados" && (
        <ResultsTab
          matches={filteredMatches}
          useQuarters={useQuarters}
          canManage={canManage}
          tournamentStatus={tournament.status}
        />
      )}

      {activeVista === "tabla" && <StandingsTab standings={filteredStandings} />}

      {activeVista === "equipos" && <TeamsTab participants={filteredParticipants} />}

      {activeVista === "config" && canManage && (
        <ConfigTab
          tournament={tournament}
          tournamentId={tournament.id}
          tournamentSlug={tournament.slug}
          leagueSlug={leagueSlug}
          isPublicFixture={isPublicFixture}
          canManage={canManage}
          busy={busy}
          pendingGroupMatches={pendingGroupMatches}
          onPublish={publish}
          onFinish={finish}
          onGeneratePlayoffs={generatePlayoffs}
          onPublicToggle={async (next) => {
            setBusy(true);
            const res = await setTournamentPublicFixture(tournament.id, next);
            setBusy(false);
            if (!res.success) toast.error(res.error);
            else {
              toast.success(next ? "Fixture público activado" : "Fixture ya no es público");
              router.refresh();
            }
          }}
        />
      )}
    </section>
  );
}

export function TorneosListItem({
  id,
  name,
  formatLabel,
  status,
  selected,
  canManage,
}: {
  id: string;
  name: string;
  formatLabel: string;
  status: string;
  selected: boolean;
  canManage?: boolean;
}) {
  const linkCls = selected
    ? "ring-2 ring-[#005CEE] ring-offset-2"
    : "hover:border-[#005CEE]";

  return (
    <li
      className={`rounded-xl border bg-white px-5 py-4 transition ${linkCls}`}
    >
      <Link href={tournamentHubHref(id, "calendario")} className="flex justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{formatLabel}</p>
        </div>
        <TournamentStatusBadge status={status} />
      </Link>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs font-semibold">
        <Link
          href={tournamentHubHref(id, "calendario")}
          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 hover:bg-slate-200"
        >
          Calendario
        </Link>
        <Link
          href={tournamentHubHref(id, "resultados")}
          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 hover:bg-slate-200"
        >
          Resultados
        </Link>
        <Link
          href={tournamentHubHref(id, "tabla")}
          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 hover:bg-slate-200"
        >
          Tabla
        </Link>
        {canManage ? (
          <Link
            href={tournamentHubHref(id, "config")}
            className="ml-auto rounded-lg px-2.5 py-1.5 text-[#005CEE] hover:bg-blue-50"
          >
            Configuración
          </Link>
        ) : null}
      </div>
    </li>
  );
}
