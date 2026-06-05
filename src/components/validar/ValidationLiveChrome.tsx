"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react";

export type ValidationResumen = {
  habilitado: number;
  suspendido: number;
  noHabilitado: number;
  total: number;
};

export type ValidationLiveChromeProps = {
  mode: "equipo" | "jugador";
  verifiedAtLabel: string;
  leagueName?: string | null;
  accentColor?: string;
  resumen?: ValidationResumen;
  search?: string;
  onSearchChange?: (value: string) => void;
};

export function ValidationLiveChrome({
  mode,
  verifiedAtLabel,
  leagueName,
  accentColor = "#0d9488",
  resumen,
  search = "",
  onSearchChange,
}: ValidationLiveChromeProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  function onRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <div
      className="sticky top-0 z-20 overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10"
      style={{ borderBottom: `3px solid ${accentColor}` }}
    >
      <div className="bg-[#0f172a] px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
                Documento oficial · consulta en vivo
              </p>
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            {leagueName ? (
              <p className="mt-1.5 truncate text-sm font-bold uppercase leading-tight text-white">
                {leagueName}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-slate-400">
              {mode === "equipo" ? "Ficha de inscripción" : "Credencial deportiva"} —{" "}
              {verifiedAtLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Actualizar
          </button>
        </div>

        {resumen ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
              {resumen.habilitado} habilitados
            </span>
            <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-[11px] font-bold text-red-300">
              {resumen.suspendido} suspendidos
            </span>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-200">
              {resumen.noHabilitado} no habilit.
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {resumen.total} deportistas
            </span>
          </div>
        ) : null}

        {mode === "equipo" && onSearchChange ? (
          <label className="relative mt-3 block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre o N° polo…"
              className="w-full rounded-lg border border-white/15 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-emerald-400/60 focus:outline-none focus:ring-1 focus:ring-emerald-400/40"
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
