import Link from "next/link";
import { Plus, Trophy } from "lucide-react";

const btnSecondary =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-50 sm:w-auto";

const btnDisabled =
  "inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400 sm:w-auto";

type TorneosModuleCardProps = {
  leagueName?: string | null;
  canCreate: boolean;
};

export function TorneosModuleCard({ leagueName, canCreate }: TorneosModuleCardProps) {
  return (
    <section className="rounded-2xl border border-[#BFDBFE] bg-white p-6 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.55)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Trophy className="h-9 w-9 shrink-0 text-violet-600" aria-hidden />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Gestión de torneos</h1>
            <p className="mt-1 text-sm text-slate-600">
              {leagueName ? (
                <>
                  Liga: <strong>{leagueName}</strong>. Elige un torneo en la lista para ver
                  calendario, cargar resultados o consultar la tabla.
                </>
              ) : (
                "Elige un torneo en la lista para calendario, resultados y tabla de posiciones."
              )}
            </p>
          </div>
        </div>
        {canCreate ? (
          <Link href="/liga/torneos/nuevo/" className={btnSecondary}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Crear torneo
          </Link>
        ) : (
          <span className={btnDisabled} title="Sin permisos para crear torneos">
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Crear torneo
          </span>
        )}
      </div>
    </section>
  );
}
