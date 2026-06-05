import { CarnetVistaPrevia } from "@/components/carnet/CarnetVistaPrevia";
import { ValidationLiveChrome } from "@/components/validar/ValidationLiveChrome";
import { ValidationStatusRibbon } from "@/components/validar/ValidationStatusRibbon";
import type { PlayerStatus } from "@/lib/db/schema";
import type { CarnetVistaPreviaProps } from "@/lib/types/carnet";
import {
  resolvePlayerValidationStatus,
  VALIDATION_STATUS_UI,
} from "@/lib/validation/player-validation-status";

export type ValidarCarnetPublicoProps = {
  carnetProps: CarnetVistaPreviaProps;
  status: PlayerStatus | null | undefined;
  verifiedAtLabel: string;
  leagueName?: string | null;
  accentColor?: string;
};

export function ValidarCarnetPublico({
  carnetProps,
  status,
  verifiedAtLabel,
  leagueName,
  accentColor,
}: ValidarCarnetPublicoProps) {
  const estado = resolvePlayerValidationStatus(status);
  const ui = VALIDATION_STATUS_UI[estado.tone];
  const desaturar = estado.tone === "suspendido";

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <ValidationLiveChrome
        mode="jugador"
        verifiedAtLabel={verifiedAtLabel}
        leagueName={leagueName}
        accentColor={accentColor}
      />

      <div className="relative mx-auto w-full max-w-[min(440px,92vw)]">
        <div
          className={`transition ${desaturar ? "grayscale-35" : ""} ${ui.ring} rounded-xl ring-2`}
        >
          <CarnetVistaPrevia {...carnetProps} presentationMode="validacion" />
        </div>
        <ValidationStatusRibbon status={status} />
      </div>

      <p className="text-center text-sm font-medium text-slate-600">{estado.description}</p>
      <p className="text-center text-xs text-slate-500">
        Vuelva a escanear el QR para actualizar el estado.
      </p>
    </div>
  );
}
