"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteTournament } from "@/lib/actions/tournaments";

type Props = {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  leagueSlug: string;
  isPublicFixture: boolean;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "borrador",
  active: "en curso",
  finished: "finalizado",
  cancelled: "cancelado",
};

export function DeleteTournamentButton({
  tournamentId,
  tournamentName,
  tournamentSlug,
  leagueSlug,
  isPublicFixture,
  status,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);

  const nameMatches =
    confirmName.trim().toLowerCase() === tournamentName.trim().toLowerCase();

  const handleDelete = async () => {
    if (!nameMatches) return;
    setLoading(true);
    try {
      const res = await deleteTournament(tournamentId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Campeonato eliminado");
      setOpen(false);
      router.push("/liga/torneos/");
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar el campeonato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConfirmName("");
          setOpen(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        Eliminar campeonato
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-tournament-title"
        >
          <div
            className="absolute inset-0"
            onClick={() => !loading && setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => !loading && setOpen(false)}
              disabled={loading}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-7 w-7" aria-hidden />
              </div>
              <h3 id="delete-tournament-title" className="mt-4 text-lg font-bold text-slate-900">
                Eliminar campeonato
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Vas a borrar <strong className="text-slate-900">{tournamentName}</strong> (
                {STATUS_LABEL[status] ?? status}). Se eliminarán fixture, resultados, tabla y equipos
                inscritos. <strong>Esta acción no se puede deshacer.</strong>
              </p>
              {isPublicFixture && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Está publicado en el portal: el enlace{" "}
                  <span className="font-mono">/torneos/{leagueSlug}/{tournamentSlug}/</span> dejará de
                  funcionar.
                </p>
              )}
              <label className="mt-4 w-full text-left text-xs font-medium text-slate-600">
                Escribe el nombre del torneo para confirmar
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  disabled={loading}
                  placeholder={tournamentName}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  autoComplete="off"
                />
              </label>
              <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loading || !nameMatches}
                  onClick={handleDelete}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden />
                  )}
                  Eliminar definitivamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
