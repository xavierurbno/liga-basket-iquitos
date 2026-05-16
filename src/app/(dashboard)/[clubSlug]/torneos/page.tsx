import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClubTorneosPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <Trophy className="h-10 w-10 shrink-0 text-amber-500" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Torneos</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Próximamente: calendario de partidos y posiciones del club en competencias oficiales.
          </p>
        </div>
      </div>
    </div>
  );
}
