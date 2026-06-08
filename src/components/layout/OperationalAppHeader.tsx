import { MasterClockCounter } from "@/components/system/MasterClockCounter";
import { LigaOperationalNav } from "@/components/nav/LigaOperationalNav";

/** Cabecera operativa compartida: `/liga/*` y módulos super-admin. */
export function OperationalAppHeader({
  userEmail,
  intranetNavLabel,
  activeLeagueId,
  headerHomeHref,
}: {
  userEmail: string | null;
  intranetNavLabel: string | null;
  activeLeagueId?: string | null;
  headerHomeHref?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#BFDBFE] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4">
        <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] text-slate-500 sm:text-xs">
          <MasterClockCounter variant="minimal" leagueId={activeLeagueId} />
        </div>
        <LigaOperationalNav
          userEmail={userEmail}
          intranetNavLabel={intranetNavLabel}
          headerHomeHref={headerHomeHref ?? "/"}
        />
      </div>
    </header>
  );
}
