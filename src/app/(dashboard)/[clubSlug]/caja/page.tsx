import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchClubDashboardStats } from "@/lib/data/club-dashboard-stats";
import { KpiCard, MovimientosRecientes, DistribucionCategorias } from "@/components/features/KpiCard";

export const dynamic = "force-dynamic";

export default async function ClubCajaPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    }
  );
  const { data: club } = await supabase.from("clubs").select("id, name").eq("slug", clubSlug).single();
  if (!club) redirect("/");

  const s = await fetchClubDashboardStats(club.id);
  const porcentajePago =
    s.totalJugadores > 0 ? Math.round((s.jugadoresActivos / s.totalJugadores) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Caja del club</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Resumen financiero del mes y últimos movimientos. Para registrar transacciones globales o filtrar por
            varios clubes, usa tesorería de liga.
          </p>
        </div>
        <Link
          href="/liga/tesoreria"
          className="rounded-xl border border-[#BFDBFE] bg-white px-4 py-2 text-xs font-bold text-[#005CEE] shadow-sm hover:border-[#005CEE]"
        >
          Abrir tesorería de liga →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          titulo="Total Jugadores"
          valor={s.totalJugadores}
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

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DistribucionCategorias datos={s.distribucionCategorias} />
        </div>
        <div className="lg:col-span-3">
          <MovimientosRecientes movimientos={s.movimientosRecientes} clubSlug={clubSlug} />
        </div>
      </div>
    </div>
  );
}
