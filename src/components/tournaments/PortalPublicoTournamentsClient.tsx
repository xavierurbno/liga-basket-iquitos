"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { setTournamentPublicFixture } from "@/lib/actions/tournaments";
import { TournamentStatusBadge } from "@/components/tournaments/TournamentStatusBadge";
import { tournamentFormatLabel } from "@/lib/tournaments/format-labels";
import type { TournamentPortalAdminRow } from "@/lib/tournaments/queries";
import { tournamentHubHref } from "@/lib/tournaments/tournament-hub-params";

type Props = {
  tournaments: TournamentPortalAdminRow[];
  leagueName: string;
  siteOrigin: string;
};

export function PortalPublicoTournamentsClient({
  tournaments,
  leagueName,
  siteOrigin,
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [publicState, setPublicState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tournaments.map((t) => [t.id, t.isPublicFixture]))
  );

  const onTogglePublic = async (t: TournamentPortalAdminRow, next: boolean) => {
    if (t.status === "draft") {
      toast.error("Inicia el torneo antes de publicarlo en el portal.");
      return;
    }
    setBusyId(t.id);
    const res = await setTournamentPublicFixture(t.id, next);
    setBusyId(null);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setPublicState((prev) => ({ ...prev, [t.id]: next }));
    toast.success(next ? "Visible en la portada del portal" : "Oculto del portal");
    router.refresh();
  };

  const publicCount = tournaments.filter((t) => publicState[t.id]).length;

  if (tournaments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-700">No hay torneos en esta liga</p>
        <p className="mt-1 text-xs text-slate-500">
          Crea un torneo en{" "}
          <Link href="/liga/torneos/nuevo/" className="font-semibold text-[#1B3A6B] underline">
            Torneos → Crear torneo
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF]/60 px-4 py-3 text-sm text-[#0f2040]">
        <p>
          <strong>{publicCount}</strong> de {tournaments.length} torneo
          {tournaments.length === 1 ? "" : "s"} visible
          {publicCount === 1 ? "" : "s"} en la{" "}
          <Link href="/" className="font-semibold underline" target="_blank" rel="noreferrer">
            portada pública
          </Link>{" "}
          ({leagueName}).
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Los visitantes verán tarjetas en la sección Campeonatos y podrán abrir calendario y
          tabla. La carga de resultados sigue en Torneos.
        </p>
      </div>

      <ul className="space-y-3">
        {tournaments.map((t) => {
          const isPublic = publicState[t.id] ?? false;
          const canPublish = t.status === "active" || t.status === "finished";
          const publicPath = `/torneos/${t.leagueSlug}/${t.slug}/`;
          const publicUrl = `${siteOrigin.replace(/\/+$/, "")}${publicPath}`;

          return (
            <li
              key={t.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[#0f2040]">{t.name}</h2>
                    <TournamentStatusBadge status={t.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {tournamentFormatLabel(t.format)}
                  </p>
                </div>
                <Link
                  href={tournamentHubHref(t.id, "config")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Settings2 className="h-3.5 w-3.5" aria-hidden />
                  Gestionar torneo
                </Link>
              </div>

              {t.status === "draft" && (
                <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  El torneo está en borrador.{" "}
                  <Link
                    href={tournamentHubHref(t.id, "config")}
                    className="font-semibold underline"
                  >
                    Inícialo
                  </Link>{" "}
                  para poder publicarlo en el portal.
                </p>
              )}

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <label
                  className={`flex items-center gap-2 text-sm ${
                    !canPublish ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isPublic}
                    disabled={!canPublish || busyId === t.id}
                    onChange={(e) => onTogglePublic(t, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#1B3A6B]"
                  />
                  <span className="font-medium text-slate-800">Mostrar en portada del portal</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {canPublish && isPublic && (
                    <>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B3A6B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f2444]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Vista previa pública
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(publicUrl);
                          toast.success("Enlace copiado");
                        }}
                        className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs font-semibold text-[#1B3A6B] hover:bg-[#DBEAFE]"
                      >
                        Copiar enlace
                      </button>
                    </>
                  )}
                  {canPublish && !isPublic && (
                    <span className="text-xs text-slate-500">
                      Activa la casilla para obtener el enlace público.
                    </span>
                  )}
                </div>
              </div>

              {isPublic && canPublish && (
                <p className="mt-2 break-all text-[11px] text-slate-500">{publicUrl}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
