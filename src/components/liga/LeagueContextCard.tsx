"use client";

import Link from "next/link";
import { Building2, AlertCircle, ExternalLink } from "lucide-react";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";

const cardShell =
  "rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.55)] sm:p-6";

type LeagueContextCardProps = {
  variant: "super_admin" | "league_admin";
  activeLeagueId: string | null;
  activeLeagueName: string | null;
  activeLeagueSlug?: string | null;
};

/** Resumen de la liga operativa (cambio de liga activa desde Plataforma — Ligas). */
export function LeagueContextCard({
  variant,
  activeLeagueId,
  activeLeagueName,
  activeLeagueSlug = null,
}: LeagueContextCardProps) {
  const hasActive = Boolean(activeLeagueId && activeLeagueName);
  const portalHref = activeLeagueSlug ? leaguePortalHome(activeLeagueSlug) : null;

  return (
    <section className={cardShell} aria-labelledby="league-context-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Building2 className="h-9 w-9 shrink-0 text-[#005CEE]" aria-hidden />
          <div className="min-w-0">
            <p
              id="league-context-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Contexto operativo
            </p>
            {hasActive ? (
              <>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Trabajas en:{" "}
                  <span className="text-[#0f2040]">{activeLeagueName}</span>
                </h2>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  {variant === "super_admin"
                    ? "Los módulos de abajo usan esta liga. Para cambiarla, crear o eliminar ligas, abre la tarjeta Plataforma — Ligas."
                    : "Todos los módulos de este panel operan sobre esta liga."}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Sin liga activa</h2>
                <p className="mt-1 flex items-start gap-2 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    Abre <strong>Plataforma — Ligas</strong> y pulsa{" "}
                    <strong>Administrar esta liga</strong> en la ficha de la liga con la que
                    quieras trabajar.
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        {portalHref ? (
          <Link
            href={portalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#005CEE] bg-white px-4 py-2.5 text-sm font-semibold text-[#005CEE] transition hover:bg-blue-50"
          >
            Ver portal
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
