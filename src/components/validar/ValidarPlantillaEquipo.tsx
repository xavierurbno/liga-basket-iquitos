"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Search } from "lucide-react";
import type { CategoryRosterValidationPlayer } from "@/lib/loaders/validation.loader";
import {
  resolvePlayerValidationStatus,
  VALIDATION_STATUS_ROW_UI,
} from "@/lib/validation/player-validation-status";

export type ValidarPlantillaEquipoProps = {
  leagueName: string | null;
  clubName: string;
  categoriaNombre: string;
  verifiedAtLabel: string;
  players: CategoryRosterValidationPlayer[];
};

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesSearch(player: CategoryRosterValidationPlayer, query: string): boolean {
  if (!query) return true;
  const q = normalizeSearch(query);
  const name = normalizeSearch(player.playerName);
  if (name.includes(q)) return true;
  if (player.jerseyNumber != null && String(player.jerseyNumber).includes(q)) return true;
  return false;
}

function initialsFromName(name: string): string {
  const parts = name.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function ValidarPlantillaEquipo({
  leagueName,
  clubName,
  categoriaNombre,
  verifiedAtLabel,
  players,
}: ValidarPlantillaEquipoProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isRefreshing, startRefresh] = useTransition();

  const filtered = useMemo(
    () => players.filter((p) => matchesSearch(p, search)),
    [players, search],
  );

  const resumen = useMemo(() => {
    let habilitado = 0;
    let suspendido = 0;
    let noHabilitado = 0;
    for (const p of players) {
      const tone = resolvePlayerValidationStatus(p.status).tone;
      if (tone === "habilitado") habilitado += 1;
      else if (tone === "suspendido") suspendido += 1;
      else noHabilitado += 1;
    }
    return { habilitado, suspendido, noHabilitado, total: players.length };
  }, [players]);

  function onRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="text-center text-xs font-semibold tracking-[0.2em] text-slate-500">
        PLANTILLA OFICIAL
      </p>
      {leagueName ? (
        <p className="mt-2 text-center text-sm font-bold uppercase leading-tight text-slate-700">
          {leagueName}
        </p>
      ) : null}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Club</p>
        <p className="mt-1 text-lg font-bold uppercase text-slate-900">{clubName}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Categoría
        </p>
        <p className="mt-1 text-base font-semibold uppercase text-slate-900">{categoriaNombre}</p>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2">
          <p className="font-bold text-emerald-800">{resumen.habilitado}</p>
          <p className="text-[10px] uppercase text-emerald-700">Habilitados</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-2 py-2">
          <p className="font-bold text-red-800">{resumen.suspendido}</p>
          <p className="text-[10px] uppercase text-red-700">Suspendidos</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-2 py-2">
          <p className="font-bold text-amber-900">{resumen.noHabilitado}</p>
          <p className="text-[10px] uppercase text-amber-800">No habilit.</p>
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o N° polo…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none ring-blue-500/0 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            aria-label="Buscar deportista"
          />
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
          Actualizar
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        Consulta en tiempo real · {verifiedAtLabel}
      </p>
      <p className="text-center text-[11px] text-slate-400">
        {filtered.length} de {resumen.total} deportistas
        {search.trim() ? " (filtrado)" : ""}
      </p>

      <ul className="mt-4 space-y-2 pb-6">
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No hay deportistas que coincidan con la búsqueda.
          </li>
        ) : (
          filtered.map((player) => {
            const estado = resolvePlayerValidationStatus(player.status);
            const rowUi = VALIDATION_STATUS_ROW_UI[estado.tone];
            const polo = player.jerseyNumber != null ? String(player.jerseyNumber) : "—";
            return (
              <li
                key={player.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {player.photoUrl ? (
                    <Image
                      src={player.photoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                      {initialsFromName(player.playerName)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold uppercase text-slate-900">
                    {player.playerName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Polo {polo}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${rowUi.pill}`}
                >
                  <span className={`h-2 w-2 rounded-full ${rowUi.dot}`} aria-hidden />
                  {estado.label}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
