import Link from "next/link";
import { Globe, ChevronRight } from "lucide-react";
import { leagueRepository } from "@/repositories/league.repository";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";
import { SiteTopNav } from "@/components/layout/SiteTopNav";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { PortalLeagueUnavailable } from "@/components/portal/PortalLeagueUnavailable";
import { formatPostgresConnectionError } from "@/lib/db/format-connection-error";
import { getPlatformName } from "@/lib/platform/platform-config";

/** Directorio de ligas en `/` (Fase 4). */
export async function ProgramLeaguesDirectory() {
  let leagues: Awaited<ReturnType<typeof leagueRepository.findAll>> = [];
  let loadError: string | null = null;

  try {
    leagues = await leagueRepository.findAll();
  } catch (err) {
    console.warn("[ProgramLeaguesDirectory] BD no disponible:", err);
    loadError = formatPostgresConnectionError(err);
  }

  const platformName = getPlatformName();

  return (
    <div className="flex flex-1 flex-col bg-[#F5F5F5]">
      <SiteTopNav hidePanelGestión={false} />

      <main className={`flex-1 py-10 ${PORTAL_SHELL_CLASS}`}>
        {loadError ? (
          <PortalLeagueUnavailable detail={loadError} />
        ) : (
          <>
            <div className="mb-10 text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#005CEE]">
                {platformName}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e3a5f] sm:text-4xl">
                Elige tu liga
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-600">
                Cada competición tiene su portal público en{" "}
                <span className="font-mono text-xs text-slate-500">/l/[slug]/</span>. Selecciona la
                tuya para ver noticias, galerías, torneos y normativas.
              </p>
            </div>

            {leagues.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
                <Globe className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
                <p className="mt-4 text-sm font-bold text-slate-500">No hay ligas publicadas aún.</p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {leagues.map((league) => (
                  <li key={league.id}>
                    <Link
                      href={leaguePortalHome(league.slug)}
                      className="group flex h-full flex-col rounded-2xl border border-[#BFDBFE] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#005CEE] hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005CEE]/10 text-[#005CEE]">
                        <Globe className="h-6 w-6" aria-hidden />
                      </div>
                      <h2 className="mt-4 text-xl font-black text-[#1e3a5f] group-hover:text-[#005CEE]">
                        {league.name}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-slate-400">/l/{league.slug}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#005CEE]">
                        Entrar al portal
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
