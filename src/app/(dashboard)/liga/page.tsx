import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { LeagueContextCard } from "@/components/liga/LeagueContextCard";
import { LigaHubCardGrid } from "@/components/nav/LigaHubCardGrid";

export default async function LigaOperationalHubPage() {
  const ctx = await getLigaOperationalContext();
  const role = ctx.role;
  const viewerSegment = role === "CLUB_DELEGATE" ? "delegate" : "staff";
  const showProfilesCard = role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";
  const showLeagueContext =
    viewerSegment === "staff" && (role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">PANEL OPERATIVO</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#0f2040]">Gestión de la liga</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          {viewerSegment === "delegate"
            ? "Como delegado gestionas el club que te asignó la administración (categorías, fichas) y puedes consultar jugadores en Búsqueda 365."
            : role === "SUPER_ADMIN"
              ? "Las tarjetas operan la liga activa. Usa Plataforma — Ligas para elegir liga, crear, eliminar o abrir la ficha de cada una."
              : "Accede a clubes, categorías, tesorería y herramientas administrativas. Usa las tarjetas de abajo para abrir cada módulo."}
        </p>
      </div>

      {showLeagueContext ? (
        <LeagueContextCard
          variant={role === "SUPER_ADMIN" ? "super_admin" : "league_admin"}
          activeLeagueId={ctx.leagueId}
          activeLeagueName={ctx.leagueName}
          activeLeagueSlug={ctx.activeLeagueSlug}
        />
      ) : null}

      <LigaHubCardGrid
        viewerSegment={viewerSegment}
        showProfilesCard={showProfilesCard}
        showSuperAdminPlatform={role === "SUPER_ADMIN"}
      />
    </div>
  );
}
