import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { leagueRepository } from "@/repositories/league.repository";
import { leaguePlanRepository } from "@/repositories/leaguePlanRepository";
import { userAssignmentRepository } from "@/repositories/userAssignmentRepository";
import { clubRepository } from "@/repositories/clubRepository";
import { LeagueSettingsForm } from "@/components/admin/LeagueSettingsForm";
import { CopyLeaguePublicLink } from "@/components/admin/CopyLeaguePublicLink";
import { LeagueOnboardingChecklist } from "@/components/admin/LeagueOnboardingChecklist";
import { ManageLeagueButton } from "@/components/liga/ManageLeagueButton";
import { DeleteLeagueButton } from "@/components/admin/DeleteLeagueButton";
import { LeagueCreatedSummary } from "@/components/admin/LeagueCreatedSummary";
import { ProvisionLeagueAdminForm } from "@/components/admin/ProvisionLeagueAdminForm";
import { LeaguePlanForm } from "@/components/admin/LeaguePlanForm";
import { LeaguePlanUsagePanel } from "@/components/admin/LeaguePlanUsagePanel";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ onboarding?: string }>;
}

export default async function LeagueFichaPage({ params, searchParams }: PageProps) {
  const { leagueId } = await params;
  const { onboarding } = await searchParams;
  const showCreatedSummary = onboarding === "1";
  const league = await leagueRepository.findById(leagueId);
  if (!league) notFound();

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

  const [admins, clubs, planUsage] = await Promise.all([
    userAssignmentRepository.findLeagueAdmins(leagueId),
    clubRepository.findByLeagueId(leagueId),
    leaguePlanRepository.getUsage(leagueId),
  ]);

  const settings = league.settings;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-4">
        <Link
          href="/super-admin/leagues/"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#005CEE]"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas las ligas
        </Link>

        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#005CEE]">
              Ficha de liga
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tighter text-slate-900">{league.name}</h1>
            <p className="mt-2 font-mono text-sm text-slate-500">{leaguePortalHome(league.slug)}</p>
            {activeLeagueId === league.id ? (
              <p className="mt-2 text-xs font-semibold text-emerald-600">Liga activa en el panel operativo</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={leaguePortalHome(league.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-[#005CEE] hover:text-[#005CEE]"
            >
              Ver portal
            </Link>
            <ManageLeagueButton leagueId={league.id} />
            <DeleteLeagueButton leagueId={league.id} leagueName={league.name} />
          </div>
        </header>

        <CopyLeaguePublicLink slug={league.slug} leagueName={league.name} />
      </div>

      {showCreatedSummary ? (
        <LeagueCreatedSummary
          leagueName={league.name}
          slug={league.slug}
          adminAssigned={admins.length > 0}
        />
      ) : null}

      <LeagueOnboardingChecklist
        slug={league.slug}
        adminCount={admins.length}
        clubCount={clubs.length}
        seasonName={settings?.seasonName}
        loginLogoUrl={settings?.loginLogoUrl}
        presidentSignatureUrl={settings?.presidentSignatureUrl}
        secretarySignatureUrl={settings?.secretarySignatureUrl}
        carnetValidityLabel={settings?.carnetValidityLabel}
        carnetSignatureMode={settings?.carnetSignatureMode}
        carnetShowFederation={settings?.carnetShowFederation}
        carnetThemePreset={settings?.carnetThemePreset}
        documentSerialPrefix={settings?.documentSerialPrefix}
        portalPrimaryColor={settings?.portalPrimaryColor}
        transferPeriodEnd={settings?.transferPeriodEnd}
        isManualOverride={settings?.isManualOverride}
      />

      <LeaguePlanUsagePanel usage={planUsage} />
      <LeaguePlanForm leagueId={league.id} initialPlan={planUsage.plan} />

      <section
        id="league-admin-form"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-black text-slate-900">Administradores de liga</h3>
        {admins.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {admins.map((a) => (
              <li
                key={a.userId}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="font-mono text-sm text-slate-700">{a.email ?? a.userId}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  LEAGUE_ADMIN
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm font-medium text-amber-800">
            Aún no hay LEAGUE_ADMIN para esta liga.
          </p>
        )}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <ProvisionLeagueAdminForm leagueId={league.id} leagueName={league.name} />
        </div>
        <p className="mt-4 text-xs font-medium text-slate-500">
          También puedes gestionar más perfiles en{" "}
          <Link href="/liga/perfiles/" className="font-semibold text-[#005CEE] hover:underline">
            /liga/perfiles/
          </Link>{" "}
          (con esta liga activa).
        </p>
      </section>

      <LeagueSettingsForm
        leagueId={league.id}
        leagueName={league.name}
        initialSettings={settings}
      />
    </div>
  );
}
