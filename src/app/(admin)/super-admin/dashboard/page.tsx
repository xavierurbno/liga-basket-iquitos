import { leagueRepository } from "@/repositories/league.repository";
import { getSponsorsByLeagueAction } from "@/lib/actions/sponsors";
import { Trophy, Users, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminDashboardPage() {
  const leagues = await leagueRepository.findAll();
  
  // Obtenemos patrocinadores de la primera liga como muestra (o un total si tuviéramos un repo de patrocinadores global)
  let totalSponsors = 0;
  if (leagues.length > 0) {
    const sponsors = await getSponsorsByLeagueAction(leagues[0].id);
    totalSponsors = sponsors.length;
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Bienvenida */}
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Bienvenido, <span className="text-blue-600">Super Admin</span>
          </h1>
          <p className="mt-4 text-slate-500 max-w-2xl text-lg leading-relaxed">
            Este es tu centro de control central. Desde aquí puedes supervisar el estado de las ligas, 
            gestionar patrocinadores institucionales y asegurar el correcto funcionamiento de la plataforma LDDBI.
          </p>
        </div>
        
        {/* Decoración abstracta de fondo */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          icon={<Trophy className="w-6 h-6 text-blue-600" />}
          label="Ligas Activas"
          value={leagues.length.toString()}
          href="/super-admin/leagues"
          color="blue"
        />
        <StatsCard 
          icon={<Star className="w-6 h-6 text-amber-500" />}
          label="Patrocinadores"
          value={totalSponsors.toString()}
          href="/super-admin/sponsors"
          color="amber"
        />
        <div className="bg-blue-600 rounded-2xl p-6 flex flex-col justify-between text-white border border-blue-500 shadow-xl shadow-blue-200/50">
          <div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 border border-white/10">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-white/80 uppercase tracking-widest">Estado del Sistema</p>
            <p className="text-2xl font-black mt-1 text-white">Operativo</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Todos los servicios activos
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            Acciones Prioritarias
          </h2>
          <div className="grid gap-3">
            <QuickActionLink 
              title="Configurar Nueva Liga" 
              desc="Añade una temporada o torneo al sistema"
              href="/super-admin/leagues"
            />
            <QuickActionLink 
              title="Gestionar Patrocinadores" 
              desc="Actualiza logos y categorías del footer"
              href="/super-admin/sponsors"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatsCard({ icon, label, value, href, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  href: string,
  color: 'blue' | 'amber'
}) {
  const colorMap = {
    blue: "hover:border-blue-200 hover:bg-blue-50/30",
    amber: "hover:border-amber-200 hover:bg-amber-50/30"
  };

  return (
    <Link href={href} className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all duration-300 ${colorMap[color]} group`}>
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors border border-slate-100">
          {icon}
        </div>
        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-1" />
      </div>
      <div className="mt-6">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </Link>
  );
}

function QuickActionLink({ title, desc, href }: { title: string, desc: string, href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
      <div>
        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
        <p className="text-xs text-slate-500 mt-1">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
    </Link>
  );
}
