import { fetchClubDashboardStats } from "@/lib/data/club-dashboard-stats";

function fmtPen(n: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export async function ClubFinanceStrip({ clubId, clubSlug }: { clubId: string; clubSlug: string }) {
  const s = await fetchClubDashboardStats(clubId);

  const items = [
    { label: "Jugadores", value: String(s.totalJugadores), hint: `${s.jugadoresPendientes} pend. pago` },
    { label: "Ingresos mes", value: fmtPen(s.ingresosMes), hint: "Ingresos" },
    { label: "Egresos mes", value: fmtPen(s.egresosMes), hint: "Egresos" },
    { label: "Saldo neto", value: fmtPen(s.saldoNeto), hint: "Mes actual" },
  ];

  return (
    <div className="border-b border-[#BFDBFE] bg-white/95 px-4 py-2 shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          {items.map((it) => (
            <div key={it.label} className="min-w-[120px]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{it.label}</p>
              <p className="text-sm font-black text-[#0f2040]">{it.value}</p>
              <p className="text-[10px] text-slate-500">{it.hint}</p>
            </div>
          ))}
        </div>
        <a
          href={`/${clubSlug}/caja`}
          className="shrink-0 rounded-lg border border-[#BFDBFE] bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#005CEE] hover:bg-white"
        >
          Ver caja del club →
        </a>
      </div>
    </div>
  );
}
