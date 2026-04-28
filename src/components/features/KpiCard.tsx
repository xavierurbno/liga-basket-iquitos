/**
 * ============================================================
 * COMPONENTES DE DASHBOARD: KpiCard + MovimientosRecientes + DistribucionCategorias
 * ============================================================
 * Estos son Server Components: no tienen estado propio,
 * reciben datos puros como props y generan HTML estático.
 *
 * SEPARAMOS en componentes pequeños (no un archivo monolítico)
 * porque Next.js puede hacer streaming de cada componente
 * independientemente con Suspense.
 * ============================================================
 */

import type { MovimientoCaja } from "@/lib/db/schema";
import { getCategoriaInfo, type Categoria } from "@/lib/utils/categoria";

// ─────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────

interface KpiCardProps {
  titulo: string;
  valor: number;
  icono: string;
  descripcion?: string;
  formato?: "numero" | "moneda" | "porcentaje";
  tendencia?: "up" | "down" | "neutral";
  color?: "default" | "green" | "red" | "amber";
}

export function KpiCard({
  titulo,
  valor,
  icono,
  descripcion,
  formato = "numero",
  tendencia = "neutral",
  color = "default",
}: KpiCardProps) {
  // Formateamos el valor según el tipo
  const valorFormateado = (() => {
    if (formato === "moneda") {
      return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
        minimumFractionDigits: 2,
      }).format(valor);
    }
    if (formato === "porcentaje") return `${valor}%`;
    return new Intl.NumberFormat("es-PE").format(valor);
  })();

  const tendenciaIcon = {
    up: "↑",
    down: "↓",
    neutral: "→",
  }[tendencia];

  const tendenciaColor = {
    up: "text-emerald-600 dark:text-emerald-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-slate-500",
  }[tendencia];

  const borderColor = {
    default: "border-slate-200 dark:border-slate-700",
    green: "border-emerald-200 dark:border-emerald-900",
    red: "border-red-200 dark:border-red-900",
    amber: "border-amber-200 dark:border-amber-900",
  }[color];

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border ${borderColor} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icono}</span>
        <span className={`text-xs font-semibold ${tendenciaColor}`}>
          {tendenciaIcon}
        </span>
      </div>

      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">
        {valorFormateado}
      </p>

      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
        {titulo}
      </p>

      {descripcion && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
          {descripcion}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MOVIMIENTOS RECIENTES
// ─────────────────────────────────────────────────────────────

interface MovimientosRecientesProps {
  movimientos: MovimientoCaja[];
  clubSlug: string;
}

const CANAL_EMOJI: Record<string, string> = {
  YAPE: "💜",
  PLIN: "💚",
  EFECTIVO: "💵",
  TRANSFERENCIA: "🏦",
  BCP: "🔵",
  BBVA: "🔷",
  INTERBANK: "🟢",
};

export function MovimientosRecientes({ movimientos, clubSlug }: MovimientosRecientesProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
          Últimos Movimientos de Caja
        </h2>
        <a
          href={`/dashboard/${clubSlug}/caja`}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Ver todos →
        </a>
      </div>

      {movimientos.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-3xl">📭</span>
          <p className="text-sm text-slate-400 mt-2">Sin movimientos registrados</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {movimientos.map((mov) => (
            <div key={mov.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              {/* Canal de pago como emoji */}
              <span className="text-lg shrink-0">
                {CANAL_EMOJI[mov.canalPago] || "💳"}
              </span>

              {/* Concepto + fecha */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {mov.concepto}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(mov.fechaMovimiento).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {" · "}
                  <span className="capitalize">{mov.canalPago.toLowerCase()}</span>
                </p>
              </div>

              {/* Monto con color según tipo */}
              <p
                className={`text-sm font-semibold shrink-0 ${
                  mov.tipo === "INGRESO"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {mov.tipo === "INGRESO" ? "+" : "-"}
                {new Intl.NumberFormat("es-PE", {
                  style: "currency",
                  currency: "PEN",
                  minimumFractionDigits: 2,
                }).format(Number(mov.monto))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DISTRIBUCIÓN POR CATEGORÍAS
// Gráfico de barras horizontal (sin librerías externas — CSS puro)
// ─────────────────────────────────────────────────────────────

interface DistribucionCategoriasProps {
  datos: { categoria: string; total: number }[];
}

export function DistribucionCategorias({ datos }: DistribucionCategoriasProps) {
  const total = datos.reduce((acc, d) => acc + Number(d.total), 0);

  // Colores por categoría
  const colores: Record<string, string> = {
    SUB_13: "bg-blue-500",
    SUB_15: "bg-emerald-500",
    SUB_17: "bg-amber-500",
    MAYORES: "bg-[#1e3a5f]",
    VETERANOS: "bg-purple-500",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 h-full">
      <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-4">
        Jugadores por Categoría
      </h2>

      {total === 0 ? (
        <div className="text-center py-8">
          <span className="text-3xl">🏀</span>
          <p className="text-sm text-slate-400 mt-2">Sin jugadores inscritos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {datos
            .sort((a, b) => Number(b.total) - Number(a.total))
            .map((item) => {
              const info = getCategoriaInfo(item.categoria as Categoria);
              const porcentaje = total > 0 ? (Number(item.total) / total) * 100 : 0;
              const colorBar = colores[item.categoria] || "bg-slate-400";

              return (
                <div key={item.categoria}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colorBar}`} />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {info.label}
                      </span>
                      <span className="text-xs text-slate-400">{info.rango}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.total}
                    </span>
                  </div>

                  {/* Barra de progreso CSS pura */}
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorBar} transition-all duration-700`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}

          {/* Total */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Total inscritos</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{total}</span>
          </div>
        </div>
      )}
    </div>
  );
}
