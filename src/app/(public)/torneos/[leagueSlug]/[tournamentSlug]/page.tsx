import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicTournamentFixture } from "@/components/tournaments/PublicTournamentFixture";
import { getPublicTournamentBySlugs } from "@/lib/tournaments/queries";
import { PortalSiteHeaderBar, resolvePortalPanelHref } from "@/components/layout/PortalSiteHeader";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readUserRole } from "@/lib/auth/read-user-role";
import { canManageTournaments } from "@/lib/auth/resolve-league-id";

export const dynamic = "force-dynamic";

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; tournamentSlug: string }>;
}) {
  const { leagueSlug, tournamentSlug } = await params;
  const data = await getPublicTournamentBySlugs(leagueSlug, tournamentSlug);
  if (!data) notFound();

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = readUserRole(user);
  const panelHref =
    user && canManageTournaments(role) ? await resolvePortalPanelHref() : undefined;

  const { tournament, groups, matches, standings } = data;

  return (
    <div className={PORTAL_SHELL_CLASS}>
      <PortalSiteHeaderBar panelHref={panelHref} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Link
          href="/#campeonatos"
          className="text-xs font-medium text-[#1B3A6B] hover:underline"
        >
          ← Campeonatos en el portal
        </Link>
        <div className="mt-4">
        <PublicTournamentFixture
          tournament={{
            name: tournament.name,
            format: tournament.format,
            status: tournament.status,
            leagueName: tournament.leagueName,
          }}
          groups={groups}
          matches={matches.map((m) => ({
            round: m.round,
            phase: m.phase,
            playoffLabel: m.playoffLabel,
            homeLabel: m.homeLabel,
            awayLabel: m.awayLabel,
            homeLogoUrl: m.homeLogoUrl,
            awayLogoUrl: m.awayLogoUrl,
            status: m.status,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
          }))}
          standings={standings.map((s) => ({
            groupId: s.groupId,
            position: s.position,
            clubName: s.clubName,
            categoryName: s.categoryName,
            clubLogoUrl: s.clubLogoUrl?.trim() || null,
            played: s.played,
            won: s.won,
            lost: s.lost,
            points: s.points,
            pointDiff: s.pointDiff,
          }))}
        />
        </div>
      </main>
    </div>
  );
}
