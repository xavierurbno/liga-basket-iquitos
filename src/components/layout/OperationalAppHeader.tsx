import { MasterClockCounter } from "@/components/system/MasterClockCounter";
import { LigaOperationalNav } from "@/components/nav/LigaOperationalNav";

/** Cabecera operativa compartida: `/liga/*` y módulos super-admin. */
export function OperationalAppHeader({
  userEmail,
  intranetNavLabel,
}: {
  userEmail: string | null;
  intranetNavLabel: string | null;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#BFDBFE] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4">
        <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-500">
          <MasterClockCounter />
        </div>
        <LigaOperationalNav userEmail={userEmail} intranetNavLabel={intranetNavLabel} />
      </div>
    </header>
  );
}
