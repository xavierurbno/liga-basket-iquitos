import type { PlayerStatus } from "@/lib/db/schema";
import {
  resolvePlayerValidationStatus,
  VALIDATION_STATUS_ROW_UI,
} from "@/lib/validation/player-validation-status";

export function FichaEstadoCelda({ status }: { status: PlayerStatus | null | undefined }) {
  const estado = resolvePlayerValidationStatus(status);
  const ui = VALIDATION_STATUS_ROW_UI[estado.tone];

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-1.5 py-0.5 text-[7px] font-bold uppercase leading-tight ${ui.pill}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ui.dot}`} aria-hidden />
      <span className="truncate">{estado.label}</span>
    </span>
  );
}
