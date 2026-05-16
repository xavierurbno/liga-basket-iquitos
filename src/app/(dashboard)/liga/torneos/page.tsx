import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LigaTorneosPage() {
  return (
    <div className="rounded-2xl border border-[#BFDBFE] bg-white p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <Trophy className="h-10 w-10 shrink-0 text-amber-500" aria-hidden />
        <div>
          <h1 className="text-2xl font-black text-[#0f2040]">Torneos</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Módulo en preparación: fixture, tablas de posiciones y calendario se integrarán aquí. Mientras tanto,
            gestiona equipos y deportistas desde <strong>Clubes</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
