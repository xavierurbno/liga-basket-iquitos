/**
 * DASHBOARD — Panel de control (Server Component)
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchClubDashboardStats } from "@/lib/data/club-dashboard-stats";
import {
  KpiCard,
  MovimientosRecientes,
  DistribucionCategorias,
} from "@/components/features/KpiCard";

interface DashboardPageProps {
  params: Promise<{ clubSlug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { clubSlug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .single();

  if (!club) redirect("/");

  const s = await fetchClubDashboardStats(club.id);

  const porcentajePago =
    s.totalJugadores > 0
      ? Math.round((Number(s.jugadoresActivos) / Number(s.totalJugadores)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Panel de Control
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString("es-PE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          titulo="Total Jugadores"
          valor={Number(s.totalJugadores)}
          icono="👥"
          notes={`${s.jugadoresPendientes} pendientes de pago`}
          tendencia={porcentajePago >= 80 ? "up" : "neutral"}
        />
        <KpiCard
          titulo="Ingresos del Mes"
          valor={s.ingresosMes}
          formato="moneda"
          icono="💰"
          notes="Ingresos en soles (S/)"
          tendencia="up"
          color="green"
        />
        <KpiCard
          titulo="Egresos del Mes"
          valor={s.egresosMes}
          formato="moneda"
          icono="📤"
          notes="Gastos en soles (S/)"
          tendencia={s.egresosMes < s.ingresosMes ? "neutral" : "down"}
          color="red"
        />
        <KpiCard
          titulo="Saldo Neto"
          valor={s.saldoNeto}
          formato="moneda"
          icono="🏦"
          notes="Balance del mes"
          tendencia={s.saldoNeto >= 0 ? "up" : "down"}
          color={s.saldoNeto >= 0 ? "green" : "red"}
        />
      </div>

      {s.jugadoresPendientes > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">
              {s.jugadoresPendientes} jugador{s.jugadoresPendientes > 1 ? "es" : ""} con pago
              pendiente
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
              Solo el {porcentajePago}% de los players tiene su inscripción al día.
            </p>
          </div>
          <a
            href={`/${clubSlug}/jugadores`}
            className="ml-auto shrink-0 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
          >
            Ver jugadores →
          </a>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <DistribucionCategorias datos={s.distribucionCategorias} />
        </div>

        <div className="lg:col-span-3">
          <MovimientosRecientes
            movimientos={s.movimientosRecientes}
            clubSlug={clubSlug}
          />
        </div>
      </div>
    </div>
  );
}
