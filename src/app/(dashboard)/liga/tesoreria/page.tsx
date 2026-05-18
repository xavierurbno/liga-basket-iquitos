import Link from "next/link";
import { redirect } from "next/navigation";
import { getTreasurySession } from "@/lib/auth/treasury-session";
import {
  getTreasuryKpis,
  getTreasuryMonthlyRollups,
  listClubsForTreasury,
  listTransactionsPage,
} from "@/lib/tesoreria/queries";
import { periodIndicatorsFromMonthlyRollups } from "@/lib/tesoreria/period-aggregates";
import { TesoreriaMovementModal } from "@/components/tesoreria/TesoreriaMovementModal";

const PAGE_SIZE = 15;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function formatPen(n: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(n);
}

function makeTreasuryHref(
  current: { page: number; type: string | null; club: string | null },
  overrides: Partial<{ page: number; type: string | null; club: string | null }>
): string {
  const p = overrides.page ?? current.page;
  const type = "type" in overrides ? overrides.type : current.type;
  const club = "club" in overrides ? overrides.club : current.club;
  const q = new URLSearchParams();
  q.set("page", String(p));
  if (type) q.set("type", type);
  if (club) q.set("club", club);
  const s = q.toString();
  return `/liga/tesoreria${s ? `?${s}` : ""}`;
}

type Search = { page?: string; type?: string; club?: string };

export default async function TesoreriaPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const session = await getTreasurySession();
  if (!session) redirect("/login");
  if (session.access.kind === "none") {
    redirect("/liga/");
  }
  const { access } = session;

  const sp = (await searchParams) ?? {};
  const canManage = access.kind === "full";

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const tipoParam = sp.type === "income" || sp.type === "expense" ? sp.type : null;
  let clubFilter: string | null = typeof sp.club === "string" && isUuid(sp.club) ? sp.club : null;

  if (access.kind === "readonly" && clubFilter && !access.clubIds.includes(clubFilter)) {
    clubFilter = null;
  }

  const allClubs = await listClubsForTreasury(access);
  const clubOptions = allClubs;

  const [kpis, { rows, total }, monthlyRollups] = await Promise.all([
    getTreasuryKpis(access, clubFilter),
    listTransactionsPage({
      access,
      filterClubId: clubFilter,
      type: tipoParam,
      page,
      pageSize: PAGE_SIZE,
    }),
    getTreasuryMonthlyRollups(access, clubFilter, 36),
  ]);

  const { ultimoMes, ultimoTrim, ultimoSem, ultimoAnio } =
    periodIndicatorsFromMonthlyRollups(monthlyRollups);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const orgHint = process.env.NEXT_PUBLIC_CLERK_ORGANIZATION_ID?.trim() || null;

  const hrefCtx = { page, type: tipoParam, club: clubFilter };

  return (
    <div className="space-y-8 font-sans">
      <section className="rounded-2xl border border-[#BFDBFE] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(30,58,138,0.55)]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">MÓDULO</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0f2040]">Tesorería</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Control de ingresos y egresos por club, con trazabilidad por método de pago y reportes por
              período.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {access.kind === "readonly" && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                Vista solo lectura (club)
              </span>
            )}
            {canManage && (
              <TesoreriaMovementModal
                clubs={clubOptions.map((c) => ({ id: c.id, name: c.name }))}
                defaultOrganizationId={orgHint}
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Ingresos del mes",
            value: formatPen(kpis.ingresosMes),
            accent: "from-emerald-500/15 to-transparent",
            border: "border-emerald-100",
          },
          {
            label: "Egresos del mes",
            value: formatPen(kpis.egresosMes),
            accent: "from-rose-500/12 to-transparent",
            border: "border-rose-100",
          },
          {
            label: "Balance actual",
            value: formatPen(kpis.balanceActual),
            accent: "from-blue-600/18 to-transparent",
            border: "border-[#BFDBFE]",
          },
        ].map((card) => (
          <article
            key={card.label}
            className={`relative overflow-hidden rounded-2xl border ${card.border} bg-white p-5 shadow-[0_18px_48px_-38px_rgba(30,64,175,0.45)]`}
          >
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 bg-linear-to-br ${card.accent}`}
            />
            <p className="relative text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className="relative mt-2 text-2xl font-black text-[#0f2040]">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(30,58,138,0.4)]">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#0f2040]">
          Indicadores por período
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Agregación mensual en base de datos (últimos 36 meses en tu alcance).
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Mes reciente", d: ultimoMes },
            { t: "Trimestre reciente", d: ultimoTrim },
            { t: "Semestre reciente", d: ultimoSem },
            { t: "Año reciente", d: ultimoAnio },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-xl border border-slate-100 bg-[#F8FAFC] px-3 py-3 text-sm text-slate-700 shadow-inner"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{x.t}</dt>
              <dd className="mt-2 space-y-1 font-medium">
                {x.d ? (
                  <>
                    <p className="text-xs text-slate-600">{x.d.label}</p>
                    <p className="text-emerald-700">Ing. {formatPen(x.d.ingresos)}</p>
                    <p className="text-rose-700">Egr. {formatPen(x.d.egresos)}</p>
                    <p className="font-bold text-[#0f2040]">Neto {formatPen(x.d.balance)}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Sin datos aún.</p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(30,58,138,0.4)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0f2040]">Historial de movimientos</h2>
            <p className="text-sm text-slate-600">{total} registro{total !== 1 ? "s" : ""}</p>
          </div>

          <form
            className="flex flex-wrap items-end gap-2"
            method="get"
            action="/liga/tesoreria"
          >
            <input type="hidden" name="page" value="1" />
            {clubOptions.length > 1 && (
              <div className="min-w-[180px]">
                <label className="block text-[11px] font-semibold uppercase text-slate-500">Club</label>
                <select
                  name="club"
                  defaultValue={clubFilter ?? ""}
                  className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Todos</option>
                  {clubOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="min-w-[150px]">
              <label className="block text-[11px] font-semibold uppercase text-slate-500">Tipo</label>
              <select
                name="type"
                defaultValue={tipoParam ?? ""}
                className="mt-1 w-full rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Egresos</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#1e3a8a] px-4 py-2 text-sm font-bold text-white shadow-[0_12px_28px_-16px_rgba(30,58,138,0.85)] hover:bg-[#172554]"
            >
              Aplicar filtros
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <Link
            className={`rounded-lg border px-3 py-1.5 ${!tipoParam ? "border-[#3B82F6] bg-[#EFF6FF] text-[#1D4ED8]" : "border-slate-200 bg-white text-slate-600"}`}
            href={makeTreasuryHref(hrefCtx, { page: 1, type: null })}
          >
            Todos
          </Link>
          <Link
            className={`rounded-lg border px-3 py-1.5 ${tipoParam === "income" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600"}`}
            href={makeTreasuryHref(hrefCtx, { page: 1, type: "income" })}
          >
            Solo ingresos
          </Link>
          <Link
            className={`rounded-lg border px-3 py-1.5 ${tipoParam === "expense" ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-600"}`}
            href={makeTreasuryHref(hrefCtx, { page: 1, type: "expense" })}
          >
            Solo egresos
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#0f2040] text-xs font-bold uppercase tracking-wide text-white">
              <tr>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Club</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Monto</th>
                <th className="px-3 py-3">Concepto</th>
                <th className="px-3 py-3">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                    No hay movimientos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-600">
                      {new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(r.transactionDate))}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-[#0f2040]">{r.clubName}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          r.type === "income"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {r.type === "income" ? "Ingreso" : "Egreso"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-900">
                      {formatPen(Number(r.amount))}
                    </td>
                    <td className="max-w-[220px] px-3 py-2.5 text-xs text-slate-700">
                      <span className="line-clamp-2">{r.concept}</span>
                      {r.notes ? (
                        <span className="mt-0.5 block line-clamp-1 text-[11px] text-slate-500">
                          {r.notes}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-slate-700">{r.paymentChannel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm" aria-label="Paginación">
            <p className="text-slate-600">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={makeTreasuryHref(hrefCtx, { page: page - 1 })}
                  className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-1.5 font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF]"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={makeTreasuryHref(hrefCtx, { page: page + 1 })}
                  className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-1.5 font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF]"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
