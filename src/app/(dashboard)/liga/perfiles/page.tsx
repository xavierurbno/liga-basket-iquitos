import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { loadPerfilesPageData } from "@/lib/loaders/perfiles.loader";
import { PerfilesHubHeader, type DelegateClubPickerOption } from "@/components/perfiles/PerfilesHubHeader";
import { ProfilesAssignmentsTable } from "@/components/perfiles/ProfilesAssignmentsTable";
import type { Role } from "@/lib/auth/withAuth";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { SelectActiveLeaguePrompt } from "@/components/liga/SelectActiveLeaguePrompt";
import { ActiveLeagueSelector } from "@/components/liga/ActiveLeagueSelector";
import { leagueRepository } from "@/repositories/league.repository";
import { partitionPerfilesAssignments } from "@/lib/perfiles/perfiles-league-scope";

export const maxDuration = 30;

export default async function LigaPerfilesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/");
  }

  const role = user.app_metadata?.role as Role | undefined;
  if (role !== "SUPER_ADMIN" && role !== "LEAGUE_ADMIN") {
    redirect("/liga/");
  }

  const operationalLeagueId = resolveOperationalLeagueId(user, cookieStore);

  if (role === "LEAGUE_ADMIN" && !operationalLeagueId) {
    return (
      <SelectActiveLeaguePrompt role={role} leagues={[]} title="Liga no asignada" />
    );
  }

  if (role === "SUPER_ADMIN" && !operationalLeagueId) {
    const leagues = await leagueRepository.findAll();
    return (
      <SelectActiveLeaguePrompt
        role={role}
        leagues={leagues}
        title="Selecciona una liga para gestionar perfiles"
        description="Los administradores de liga y delegados se registran por liga. Elige la liga de Iquitos (u otra) antes de continuar."
      />
    );
  }

  const leagueId = operationalLeagueId!;
  const [league, allLeagues, perfilesData] = await Promise.all([
    leagueRepository.findById(leagueId),
    role === "SUPER_ADMIN" ? leagueRepository.findAll() : Promise.resolve([]),
    loadPerfilesPageData(leagueId),
  ]);
  const leagueName = league?.name ?? null;
  const { allRows, clubRows } = perfilesData;
  const { leagueRows: tableRows, orphanRows } = partitionPerfilesAssignments(allRows, leagueId);

  const canManageDestructive = role === "SUPER_ADMIN";
  const canInviteStaff = role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";

  const clubOptionsForPicker: DelegateClubPickerOption[] = clubRows
    .filter((c) => c.leagueId === leagueId)
    .map(({ id, name, slug }) => ({ id, name, slug }));

  return (
    <div className="space-y-8 pb-12">
      {role === "SUPER_ADMIN" && allLeagues.length > 0 ? (
        <div className="rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#005CEE]">
            Liga operativa
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Perfiles y altas se aplican solo a la liga seleccionada. Si no ves a alguien (p. ej. admin
            de Iquitos), cambia aquí a esa liga.
          </p>
          <div className="mt-4">
            <ActiveLeagueSelector leagues={allLeagues} activeLeagueId={leagueId} />
          </div>
        </div>
      ) : null}

      {leagueName ? (
        <p className="text-sm text-slate-600">
          Mostrando personal de: <strong className="text-[#0f2040]">{leagueName}</strong>
          {role === "LEAGUE_ADMIN" ? (
            <span className="text-slate-500">
              {" "}
              · puedes registrar delegados de club de esta liga
            </span>
          ) : role === "SUPER_ADMIN" ? (
            <span className="text-slate-500">
              {" "}
              · puedes registrar administradores de liga y delegados
            </span>
          ) : null}
        </p>
      ) : null}

      <PerfilesHubHeader
        canInviteStaff={canInviteStaff}
        clubOptions={clubOptionsForPicker}
        defaultLeagueId={leagueId}
        leagueName={leagueName}
        actorRole={role}
      />

      <ProfilesAssignmentsTable
        rows={tableRows}
        canDelete={canManageDestructive}
        canEdit={canInviteStaff}
        clubOptions={clubOptionsForPicker}
        actorRole={role}
        actorLeagueId={leagueId}
        defaultLeagueId={leagueId}
        leagueName={leagueName}
        inviteLeagueSlug={league?.slug ?? null}
      />

      {role === "SUPER_ADMIN" && orphanRows.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <p className="font-bold text-amber-900">Asignaciones pendientes de liga</p>
            <p className="mt-1 text-amber-900/90">
              Estos usuarios existen en la base de datos pero no aparecen al filtrar por liga (p. ej.
              administrador sin <code className="text-xs">league_id</code>). Puedes eliminarlos,
              editarlos o volver a dar de alta el mismo correo en la liga activa para corregirlos
              automáticamente.
            </p>
          </div>
          <ProfilesAssignmentsTable
            rows={orphanRows}
            canDelete={canManageDestructive}
            canEdit={canInviteStaff}
            clubOptions={clubOptionsForPicker}
            actorRole={role}
            actorLeagueId={leagueId}
            defaultLeagueId={leagueId}
            leagueName={leagueName}
            inviteLeagueSlug={league?.slug ?? null}
            emptyMessage="No hay asignaciones huérfanas."
            showOrphanScopeHint
          />
        </div>
      ) : null}
    </div>
  );
}
