import type { PlayerStatus } from "@/lib/db/schema";
import {
  resolvePlayerValidationStatus,
  VALIDATION_STATUS_UI,
} from "@/lib/validation/player-validation-status";

export function ValidationStatusRibbon({ status }: { status: PlayerStatus | null | undefined }) {
  const estado = resolvePlayerValidationStatus(status);
  const ui = VALIDATION_STATUS_UI[estado.tone];

  return (
    <div
      className="pointer-events-none absolute -right-1 top-3 z-30 origin-top-right rotate-[-8deg] shadow-lg"
      role="status"
      aria-live="polite"
    >
      <div className={`rounded-md border-2 px-3 py-1.5 ${ui.banner} ${ui.ring} ring-2`}>
        <p className={`text-center text-xs font-black uppercase tracking-wide ${ui.badge} rounded px-2 py-0.5`}>
          {estado.label}
        </p>
      </div>
    </div>
  );
}
