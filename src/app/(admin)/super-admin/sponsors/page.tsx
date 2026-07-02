import { leagueRepository } from "@/repositories/league.repository";
import { withIntranetRead } from "@/lib/db/with-intranet-read";
import { sponsorRepository } from "@/repositories/sponsorRepository";
import { SponsorManagerClient } from "@/components/admin/SponsorManagerClient";
import { Building2 } from "lucide-react";

export default async function SponsorsAdminPage() {
  const leagues = (await withIntranetRead((tx) => leagueRepository.findAll(tx))) ?? [];

  // Traer todos los patrocinadores de todas las ligas
  const allSponsors = await Promise.all(
    leagues.map((l) => sponsorRepository.findByLeague(l.id))
  ).then((results) => results.flat());

  // Mapa id → nombre para mostrarlo en la tabla
  const leagueMap = Object.fromEntries(leagues.map((l) => [l.id, l.name]));
  const leagueOptions = leagues.map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="space-y-12 pb-24">
      {/* ── Encabezado ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-xs font-black tracking-[0.15em] text-slate-400 uppercase">
            Panel Super Admin
          </p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter sm:text-5xl">
            Gestión de{" "}
            <span className="text-blue-600 italic">Patrocinadores</span>
          </h1>
          <p className="text-slate-500 font-semibold max-w-2xl leading-snug">
            Configura los socios, patrocinadores oficiales e instituciones que
            aparecen en el footer del portal de la liga.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {allSponsors.length} patrocinador{allSponsors.length !== 1 ? "es" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
            <Building2 size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {leagues.length} liga{leagues.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      {/* ── Gestor de Patrocinadores (Cliente) ── */}
      <SponsorManagerClient 
        leagues={leagueOptions} 
        initialSponsors={allSponsors} 
        leagueMap={leagueMap} 
      />
    </div>
  );
} 
