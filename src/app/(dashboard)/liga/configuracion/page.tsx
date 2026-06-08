import { redirect } from "next/navigation";
import { CarnetConfigAlert } from "@/components/carnet/CarnetConfigAlert";
import { LeagueSettingsForm } from "@/components/admin/LeagueSettingsForm";
import { buildCarnetLeagueReadiness } from "@/lib/carnet/carnetLeagueReadiness";
import { isLddbiCarnetPreset } from "@/lib/carnet/lddbiTemplateLayout";
import type { CarnetThemePreset } from "@/lib/carnet/carnetTheme";
import { SelectActiveLeaguePrompt } from "@/components/liga/SelectActiveLeaguePrompt";
import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { isDashboardSuperAdmin } from "@/lib/auth/dashboard-super-admin";
import { leagueRepository } from "@/repositories/league.repository";
import { settingsRepository } from "@/repositories/settingsRepository";

export const metadata = {
  title: "Marca e identidad | Liga",
  description: "Logo, colores y mensaje del portal público y login de tu liga.",
};

export default async function LigaConfiguracionPage() {
  const ctx = await getLigaOperationalContext();
  const superLike = isDashboardSuperAdmin(ctx.user);
  const allowed =
    ctx.role === "SUPER_ADMIN" || ctx.role === "LEAGUE_ADMIN" || superLike;
  if (!allowed) redirect("/liga/");

  if (ctx.needsLeagueSelection) {
    return (
      <SelectActiveLeaguePrompt
        role={ctx.role}
        leagues={ctx.leagues}
        activeLeagueId={ctx.leagueId}
        title="Selecciona una liga para configurar la marca"
        description="Logo, colores del portal y mensaje institucional se guardan por liga."
      />
    );
  }

  const league = await leagueRepository.findById(ctx.leagueId!);
  if (!league) redirect("/liga/");

  const settings = await settingsRepository.getLeagueSettings(league.id);
  const { hasLeagueMonoLogoAvailable } = await import(
    "@/lib/logos/resolve-league-logo-buffer"
  );
  const carnetPreset = settings?.carnetThemePreset as CarnetThemePreset | undefined;
  const showFederation = settings?.carnetShowFederation !== false;
  const hasFederationLogo =
    !showFederation ||
    Boolean(settings?.carnetFederationLogoUrl?.trim()) ||
    isLddbiCarnetPreset(carnetPreset);
  const leagueReadiness = buildCarnetLeagueReadiness(
    settings,
    Boolean(settings?.loginLogoUrl?.trim()),
    hasFederationLogo,
    carnetPreset,
    await hasLeagueMonoLogoAvailable(league.id),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-black text-[#0f2040]">Marca e identidad</h1>
        <p className="mt-1 text-sm text-slate-600">
          Personaliza el portal público <strong>/l/{league.slug}/</strong>, la pantalla de login, las
          redes sociales, los documentos PDF y el <strong>carnet deportista CR80</strong> de{" "}
          <strong>{league.name}</strong>.
        </p>
      </header>
      <CarnetConfigAlert
        warnings={leagueReadiness.warnings}
        settingsHref="#carnet-settings"
        title={leagueReadiness.ready ? "Carnet listo para imprimir" : "Completa el carnet institucional"}
      />
      <LeagueSettingsForm
        leagueId={league.id}
        leagueName={league.name}
        initialSettings={settings}
      />
    </div>
  );
}
