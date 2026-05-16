import { leagueRepository } from "@/repositories/league.repository";
import { LeagueSettingsForm } from "@/components/admin/LeagueSettingsForm";
import { CreateLeagueModal } from "@/components/admin/CreateLeagueModal";
import { DeleteLeagueButton } from "@/components/admin/DeleteLeagueButton";

/**
 * LeaguesAdminPage (Super Admin)
 * Renderiza la lista de ligas y sus formularios de configuración.
 * Es un Server Component por defecto para máxima eficiencia.
 */
export const dynamic = "force-dynamic";

export default async function LeaguesAdminPage() {
  // Obtener todas las ligas con sus configuraciones vinculadas
  const leagues = await leagueRepository.findAllWithSettings();

  return (
    <div className="space-y-10 pb-20">
      {/* Título de la Sección */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter sm:text-5xl">
            Control de <span className="text-blue-600 italic">Ligas</span>
          </h1>
          <p className="text-slate-500 font-semibold max-w-2xl leading-snug">
            Panel centralizado para la gestión de temporadas, sistemas de puntuación y límites institucionales.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {leagues.length} {leagues.length === 1 ? 'Liga Activa' : 'Ligas Activas'}
            </span>
          </div>

          <CreateLeagueModal />
        </div>
      </header>

      {/* Lista de Formularios (Uno por Liga) */}
      <div className="grid grid-cols-1 gap-16">
        {leagues.map((league) => (
          <section key={league.id} className="relative group">
            {/* Divisor Visual con Identificador */}
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    ID: {league.id.slice(0, 8)}...
                  </span>
                </div>
                <DeleteLeagueButton leagueId={league.id} leagueName={league.name} />
              </div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            
            <LeagueSettingsForm 
              leagueId={league.id}
              leagueName={league.name}
              initialSettings={league.settings}
            />
          </section>
        ))}

        {/* Empty State */}
        {leagues.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-400">No hay ligas configuradas</p>
              <p className="text-sm text-slate-300 font-medium mt-1">Crea una liga en la base de datos para comenzar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
