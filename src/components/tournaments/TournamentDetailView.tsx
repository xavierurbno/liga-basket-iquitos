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
import { TournamentExportPdfButton } from "@/components/tournaments/TournamentExportPdfButton";
import { formatQuarterLine } from "@/lib/tournaments/score-quarters";
import { TournamentStatusBadge } from "@/components/tournaments/TournamentStatusBadge";
import {
  RecordResultModal,
  type TournamentMatchCard,
} from "@/components/tournaments/RecordResultModal";
import {
  StandingsTeamCell,
  TournamentMatchTeams,
} from "@/components/tournaments/TournamentMatchTeams";
import { DeleteTournamentButton } from "@/components/tournaments/DeleteTournamentButton";
import { BRAND_ELECTRIC_BLUE } from "@/lib/league-branding";

type Tab = "calendar" | "standings" | "teams" | "config";

const FORMAT_LABEL: Record<string, string> = {
  linear: "Todos contra todos (una vez)",
  home_and_away: "Ida y vuelta",
  groups: "Fase de grupos",
  groups_playoffs: "Grupos + play-offs",
};

const PLAYOFF_GROUP_NAME = "Play-offs";

export type TournamentGroupTab = { id: string; name: string };

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programado",
  finished: "Finalizado",
  postponed: "Aplazado",
  wo_home: "W.O. local",
  wo_away: "W.O. visitante",
  cancelled: "Cancelado",
};

function MatchStatusAndScore({
  status,
  homeScore,
  awayScore,
}: {
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}) {
  return (
    <p className="text-xs">
      <span className="text-slate-500">{STATUS_LABEL[status] ?? status}</span>
      {status === "finished" && homeScore != null && awayScore != null && (
        <>
          <span className="text-slate-400"> · </span>
          <span className="font-bold tabular-nums" style={{ color: BRAND_ELECTRIC_BLUE }}>
            {homeScore} - {awayScore}
          </span>
        </>
      )}
    </p>
  );
}

export type TournamentMatchRow = TournamentMatchCard & {
  round: number;
  phase?: string;
  playoffLabel?: string | null;
};

export function TournamentDetailView({
  tournament,
  groups,
  participants,
  matches,
  standings,
  pendingGroupMatches,
  leagueSlug,
  isPublicFixture,
  canManage,
}: {
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
  leagueSlug: string;
  isPublicFixture: boolean;
  pendingGroupMatches: number;
  groups: TournamentGroupTab[];
  participants: {
    categoryId: string;
    categoryName: string;
    clubName: string;
    groupId?: string;
  }[];
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
  canManage: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("calendar");
  const [busy, setBusy] = useState(false);
  const [calendarPhase, setCalendarPhase] = useState<"group" | "playoff">("group");

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

  const tabs: { key: Tab; label: string }[] = [
    { key: "calendar", label: "Calendario" },
    { key: "standings", label: "Tabla" },
    { key: "teams", label: "Equipos" },
    { key: "config", label: "Configuración" },
  ];

  return (
    <div>
      <Link href="/liga/torneos/" className="text-xs font-medium text-[#1B3A6B] hover:underline">
        ← Torneos
      </Link>
      <TournamentDetailHeader tournament={tournament} />
      <TournamentTabBar tabs={tabs} tab={tab} onTab={setTab} />
      {isPlayoffsFormat && tab === "calendar" && (
        <PhaseToggleBar phase={calendarPhase} playoffsReady={playoffsGenerated} onPhase={setCalendarPhase} />
      )}
      {multiGroup &&
        calendarPhase === "group" &&
        (tab === "calendar" || tab === "standings" || tab === "teams") && (
          <GroupFilterBar
            groups={regularGroups}
            activeGroupId={activeGroupId}
            onSelect={setActiveGroupId}
          />
        )}
      {tab === "calendar" && (
        <CalendarTab
          rounds={rounds}
          matches={filteredMatches}
          isPlayoffView={calendarPhase === "playoff"}
          useQuarters={useQuarters}
          canManage={canManage}
          tournamentStatus={tournament.status}
        />
      )}
      {tab === "standings" && <StandingsTab standings={filteredStandings} />}
      {tab === "teams" && <TeamsTab participants={filteredParticipants} />}
      {tab === "config" && (
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
    </div>
  );
}

export function TournamentDetailHeader({
  tournament,
}: {
  tournament: { name: string; format: string; status: string };
}) {
  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-black text-[#005CEE]">{tournament.name}</h1>
        <TournamentStatusBadge status={tournament.status} />
      </div>
      <p className="mt-1 text-sm text-slate-600">{FORMAT_LABEL[tournament.format] ?? tournament.format}</p>
    </>
  );
}

export function PhaseToggleBar({
  phase,
  playoffsReady,
  onPhase,
}: {
  phase: "group" | "playoff";
  playoffsReady: boolean;
  onPhase: (p: "group" | "playoff") => void;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => onPhase("group")}
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
          phase === "group" ? "bg-[#1B3A6B] text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        Fase de grupos
      </button>
      <button
        type="button"
        disabled={!playoffsReady}
        onClick={() => onPhase("playoff")}
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40 ${
          phase === "playoff" ? "bg-[#F5A623] text-[#1B3A6B]" : "bg-slate-100 text-slate-600"
        }`}
      >
        Play-offs
      </button>
    </div>
  );
}

export function GroupFilterBar({
  groups,
  activeGroupId,
  onSelect,
}: {
  groups: TournamentGroupTab[];
  activeGroupId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {groups.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onSelect(g.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            activeGroupId === g.id
              ? "bg-[#1B3A6B] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}

function TournamentTabBar({
  tabs,
  tab,
  onTab,
}: {
  tabs: { key: Tab; label: string }[];
  tab: Tab;
  onTab: (t: Tab) => void;
}) {
  return (
    <div className="mt-6 flex gap-1 border-b border-slate-200">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onTab(key)}
          className={`px-4 py-2 text-sm font-semibold ${
            tab === key
              ? "border-b-2 border-[#1B3A6B] text-[#1B3A6B]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function CalendarTab({
  rounds,
  matches,
  isPlayoffView,
  useQuarters,
  canManage,
  tournamentStatus,
}: {
  rounds: number[];
  matches: TournamentMatchRow[];
  isPlayoffView: boolean;
  useQuarters: boolean;
  canManage: boolean;
  tournamentStatus: string;
}) {
  if (isPlayoffView && matches.length === 0) {
    return (
      <p className="mt-6 text-sm text-slate-500">
        Genera la llave en Configuración cuando termines la fase de grupos.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {rounds.length === 0 && <p className="text-sm text-slate-500">No hay partidos programados.</p>}
      {rounds.map((round) => (
        <section key={round}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#005CEE]">
            {isPlayoffView ? `Ronda ${round - 99}` : `Jornada ${round}`}
          </h2>
          <div className="space-y-2">
            {matches
              .filter((m) => m.round === round)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    {m.playoffLabel && (
                      <p className="text-xs font-bold uppercase text-amber-700">{m.playoffLabel}</p>
                    )}
                    <TournamentMatchTeams
                      homeLabel={m.homeLabel}
                      awayLabel={m.awayLabel}
                      homeLogoUrl={m.homeLogoUrl}
                      awayLogoUrl={m.awayLogoUrl}
                    />
                    <MatchStatusAndScore
                      status={m.status}
                      homeScore={m.homeScore}
                      awayScore={m.awayScore}
                    />
                    {useQuarters && m.status === "finished" && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatQuarterLine(m, "home")
                          ? `L: ${formatQuarterLine(m, "home")}`
                          : ""}
                        {formatQuarterLine(m, "away")
                          ? ` · V: ${formatQuarterLine(m, "away")}`
                          : ""}
                      </p>
                    )}
                  </div>
                  {canManage &&
                    tournamentStatus !== "finished" &&
                    m.homeLabel !== "Por definir" &&
                    m.awayLabel !== "Por definir" && (
                      <RecordResultModal
                        match={m}
                        canManage={canManage}
                        useQuarters={useQuarters}
                      />
                    )}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ResultsTab({
  matches,
  useQuarters,
  canManage,
  tournamentStatus,
}: {
  matches: TournamentMatchRow[];
  useQuarters: boolean;
  canManage: boolean;
  tournamentStatus: string;
}) {
  const playable = (m: TournamentMatchRow) =>
    m.homeLabel !== "Por definir" && m.awayLabel !== "Por definir";

  const pending = matches.filter(
    (m) =>
      playable(m) &&
      (m.status === "scheduled" || m.status === "postponed"),
  );

  const recentFinished = matches
    .filter((m) => m.status === "finished" && playable(m))
    .sort((a, b) => b.round - a.round)
    .slice(0, 12);

  const MatchRow = ({ m }: { m: TournamentMatchRow }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div>
        {m.playoffLabel && (
          <p className="text-xs font-bold uppercase text-amber-700">{m.playoffLabel}</p>
        )}
        <TournamentMatchTeams
          homeLabel={m.homeLabel}
          awayLabel={m.awayLabel}
          homeLogoUrl={m.homeLogoUrl}
          awayLogoUrl={m.awayLogoUrl}
        />
        <MatchStatusAndScore
          status={m.status}
          homeScore={m.homeScore}
          awayScore={m.awayScore}
        />
        {useQuarters && m.status === "finished" && (
          <p className="mt-0.5 text-[10px] text-slate-400">
            {formatQuarterLine(m, "home") ? `L: ${formatQuarterLine(m, "home")}` : ""}
            {formatQuarterLine(m, "away") ? ` · V: ${formatQuarterLine(m, "away")}` : ""}
          </p>
        )}
      </div>
      {canManage &&
        tournamentStatus !== "finished" &&
        playable(m) &&
        m.status !== "finished" && (
          <RecordResultModal match={m} canManage={canManage} useQuarters={useQuarters} />
        )}
    </div>
  );

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#005CEE]">
          Pendientes de resultado
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            No hay partidos pendientes en esta selección.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>
      {recentFinished.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#005CEE]">
            Últimos resultados
          </h2>
          <div className="space-y-2">
            {recentFinished.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function StandingsTab({
  standings,
}: {
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
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Equipo</th>
            <th className="px-3 py-2 text-center">PJ</th>
            <th className="px-3 py-2 text-center">PG</th>
            <th className="px-3 py-2 text-center">PP</th>
            <th className="px-3 py-2 text-center">PF</th>
            <th className="px-3 py-2 text-center">PC</th>
            <th className="px-3 py-2 text-center">+/-</th>
            <th className="px-3 py-2 text-center">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={`${row.position}-${row.clubName}-${row.categoryName}`}
              className="border-t border-slate-100"
            >
              <td className="px-3 py-2 font-semibold">{row.position}</td>
              <td className="px-3 py-2">
                <StandingsTeamCell
                  clubName={row.clubName}
                  categoryName={row.categoryName}
                  clubLogoUrl={row.clubLogoUrl}
                />
              </td>
              <td className="px-3 py-2 text-center">{row.played}</td>
              <td className="px-3 py-2 text-center">{row.won}</td>
              <td className="px-3 py-2 text-center">{row.lost}</td>
              <td className="px-3 py-2 text-center">{row.pointsFor}</td>
              <td className="px-3 py-2 text-center">{row.pointsAgainst}</td>
              <td className="px-3 py-2 text-center">{row.pointDiff}</td>
              <td className="px-3 py-2 text-center font-bold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TeamsTab({
  participants,
}: {
  participants: { categoryId: string; categoryName: string; clubName: string }[];
}) {
  return (
    <ul className="mt-6 grid gap-2 sm:grid-cols-2">
      {participants.map((p) => (
        <li
          key={p.categoryId}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <span className="font-semibold text-[#0f2040]">{p.clubName}</span>
          <span className="text-slate-500"> · {p.categoryName}</span>
        </li>
      ))}
    </ul>
  );
}

export function ConfigTab({
  tournament,
  tournamentId,
  tournamentSlug,
  leagueSlug,
  isPublicFixture,
  canManage,
  busy,
  pendingGroupMatches,
  onPublish,
  onFinish,
  onGeneratePlayoffs,
  onPublicToggle,
}: {
  tournament: {
    name: string;
    format?: string;
    status: string;
    settings: {
      rulesNote?: string;
      playoffsGenerated?: boolean;
      teamsPerGroupToAdvance?: number;
    } | null;
  };
  tournamentId: string;
  tournamentSlug: string;
  leagueSlug: string;
  isPublicFixture: boolean;
  canManage: boolean;
  busy: boolean;
  pendingGroupMatches: number;
  onPublish: () => void;
  onFinish: () => void;
  onGeneratePlayoffs: () => void;
  onPublicToggle: (next: boolean) => void;
}) {
  const publicPath = `/torneos/${leagueSlug}/${tournamentSlug}/`;
  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}${publicPath}` : publicPath;
  const showGeneratePlayoffs =
    canManage &&
    tournament.format === "groups_playoffs" &&
    !tournament.settings?.playoffsGenerated &&
    tournament.status !== "finished" &&
    tournament.status !== "cancelled";

  return (
    <div className="mt-6 max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      {tournament.settings?.rulesNote && (
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Reglamento</p>
          <p className="mt-1 text-sm text-slate-700">{tournament.settings.rulesNote}</p>
        </div>
      )}
      {showGeneratePlayoffs && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Fase de play-offs</p>
          <p className="mt-1 text-xs">
            Clasifican {tournament.settings?.teamsPerGroupToAdvance ?? 2} por grupo.{" "}
            {pendingGroupMatches > 0
              ? `Quedan ${pendingGroupMatches} partidos de grupos sin resultado.`
              : "Puedes generar la llave de eliminación."}
          </p>
          <button
            type="button"
            disabled={busy || pendingGroupMatches > 0}
            onClick={onGeneratePlayoffs}
            className="mt-3 w-full rounded-xl bg-[#F5A623] py-2.5 text-sm font-semibold text-[#1B3A6B] disabled:opacity-50"
          >
            Generar llave de play-offs
          </button>
        </div>
      )}
      {tournament.settings?.playoffsGenerated && (
        <p className="text-sm text-emerald-700">Llave de play-offs generada. Ver pestaña Calendario → Play-offs.</p>
      )}
      {canManage && tournament.status !== "draft" && (
        <div className="space-y-3 rounded-xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-800">Fixture público y PDF</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublicFixture}
              disabled={busy}
              onChange={(e) => onPublicToggle(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Mostrar en portal público
          </label>
          {isPublicFixture && (
            <p className="break-all text-xs text-[#1B3A6B]">
              <a href={publicUrl} target="_blank" rel="noreferrer" className="underline">
                {publicUrl}
              </a>
            </p>
          )}
          <TournamentExportPdfButton tournamentId={tournamentId} />
        </div>
      )}
      {canManage && tournament.status === "draft" && (
        <button
          type="button"
          disabled={busy}
          onClick={onPublish}
          className="w-full rounded-xl bg-[#1B3A6B] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Iniciar torneo
        </button>
      )}
      {canManage && tournament.status === "active" && (
        <button
          type="button"
          disabled={busy}
          onClick={onFinish}
          className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Finalizar torneo
        </button>
      )}
      {tournament.status === "finished" && (
        <p className="text-sm text-slate-500">Este torneo ya está cerrado.</p>
      )}
      {canManage && (
        <div className="border-t border-slate-100 pt-4">
          <DeleteTournamentButton
            tournamentId={tournamentId}
            tournamentName={tournament.name}
            isPublicFixture={isPublicFixture}
            leagueSlug={leagueSlug}
            tournamentSlug={tournamentSlug}
            status={tournament.status}
          />
        </div>
      )}
    </div>
  );
}
