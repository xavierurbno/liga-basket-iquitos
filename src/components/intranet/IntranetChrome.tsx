import { IntranetTopNav } from "@/components/intranet/IntranetTopNav";
import type { IntranetNavClub, IntranetNavLeague } from "@/components/intranet/IntranetSuperAdminNav";
import type { IntranetRole } from "@/lib/auth/intranet-roles";

export function IntranetChrome({
  role,
  userEmail,
  clubSlug,
  clubId,
  leagues,
  clubs,
  activeLeagueId,
  activeLeagueName,
  children,
}: {
  role: IntranetRole;
  userEmail: string | null;
  clubName?: string | null;
  clubSlug?: string | null;
  clubId?: string | null;
  leagueName?: string | null;
  leagues?: IntranetNavLeague[];
  clubs?: IntranetNavClub[];
  leagueClubs?: IntranetNavClub[];
  activeLeagueId?: string | null;
  activeLeagueName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <IntranetTopNav
        role={role}
        userEmail={userEmail}
        clubSlug={clubSlug ?? null}
        clubId={clubId ?? null}
        leagues={leagues}
        clubs={clubs}
        activeLeagueId={activeLeagueId}
        activeLeagueName={activeLeagueName}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
