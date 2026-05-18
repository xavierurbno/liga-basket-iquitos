"use client";

import { Building2, AlertCircle } from "lucide-react";
import {
  ActiveLeagueSelector,
  type ActiveLeagueOption,
} from "@/components/liga/ActiveLeagueSelector";
import { CreateLeagueModal } from "@/components/admin/CreateLeagueModal";

const cardShell =
  "rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.55)] sm:p-6";

type LeagueContextCardProps = {
  variant: "super_admin" | "league_admin";
  leagues: ActiveLeagueOption[];
  activeLeagueId: string | null;
  activeLeagueName: string | null;
};

export function LeagueContextCard({
  variant,
  leagues,
  activeLeagueId,
  activeLeagueName,
}: LeagueContextCardProps) {
  const hasActive = Boolean(activeLeagueId && activeLeagueName);

  return (
    <section className={cardShell} aria-labelledby="league-context-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Building2 className="h-9 w-9 shrink-0 text-[#005CEE]" aria-hidden />
          <div>
            <p
              id="league-context-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Contexto de gestión
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">
              {variant === "super_admin" ? "Liga en la que trabajas" : "Tu liga asignada"}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              {variant === "super_admin"
                ? "Los módulos del panel usan la liga que elijas aquí. También puedes crear una liga nueva."
                : "Todos los módulos de este panel operan sobre esta liga."}
            </p>
          </div>
        </div>

        {variant === "super_admin" ? (
          <CreateLeagueModal
            triggerLabel="Nueva liga"
            triggerClassName="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#005CEE] bg-white px-4 py-2.5 text-sm font-semibold text-[#005CEE] transition hover:bg-blue-50"
          />
        ) : null}
      </div>

      {variant === "super_admin" ? (
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1">
            <ActiveLeagueSelector
              leagues={leagues}
              activeLeagueId={activeLeagueId}
              compact={false}
            />
          </div>
          {hasActive ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
              Activa: <strong>{activeLeagueName}</strong>
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>Elige una liga para gestionar clubes, torneos y patrocinadores.</span>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-[#BFDBFE] bg-slate-50 px-4 py-3 text-sm text-slate-800">
          Estás gestionando:{" "}
          <strong>{activeLeagueName ?? "Liga sin nombre"}</strong>
        </p>
      )}
    </section>
  );
}
