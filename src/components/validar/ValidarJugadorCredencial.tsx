import Image from "next/image";
import { HiBan, HiCheckCircle, HiExclamationCircle } from "react-icons/hi";
import type { PlayerStatus } from "@/lib/db/schema";
import {
  resolvePlayerValidationStatus,
  VALIDATION_STATUS_UI,
  type ValidationStatusTone,
} from "@/lib/validation/player-validation-status";

export type ValidarJugadorCredencialProps = {
  leagueName: string | null;
  clubName: string;
  categoriaNombre: string;
  playerName: string;
  carnetDisplay: string | null;
  carnetNumber: string | null;
  jerseyNumber: number | null;
  photoUrl: string | null;
  status: PlayerStatus | null;
  verifiedAtLabel: string;
};

function StatusIcon({ tone }: { tone: ValidationStatusTone }) {
  if (tone === "habilitado") {
    return <HiCheckCircle className="h-7 w-7 shrink-0" aria-hidden />;
  }
  if (tone === "suspendido") {
    return <HiBan className="h-7 w-7 shrink-0" aria-hidden />;
  }
  return <HiExclamationCircle className="h-7 w-7 shrink-0" aria-hidden />;
}

export function ValidarJugadorCredencial({
  leagueName,
  clubName,
  categoriaNombre,
  playerName,
  carnetDisplay,
  carnetNumber,
  jerseyNumber,
  photoUrl,
  status,
  verifiedAtLabel,
}: ValidarJugadorCredencialProps) {
  const estado = resolvePlayerValidationStatus(status);
  const ui = VALIDATION_STATUS_UI[estado.tone];
  const carnetLine = carnetDisplay ?? carnetNumber;
  const poloLine = jerseyNumber != null ? String(jerseyNumber) : null;

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="text-center text-xs font-semibold tracking-[0.2em] text-slate-500">
        CREDENCIAL DEPORTIVA
      </p>
      {leagueName ? (
        <p className="mt-2 text-center text-sm font-bold uppercase leading-tight text-slate-700">
          {leagueName}
        </p>
      ) : null}

      <section
        className={`mt-5 rounded-2xl border-2 px-4 py-5 shadow-sm ${ui.banner} ${ui.ring} ring-2`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center gap-3">
          <StatusIcon tone={estado.tone} />
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Estado en cancha
            </p>
            <p
              className={`mt-1 inline-flex rounded-full px-4 py-1.5 text-lg font-black uppercase tracking-wide ${ui.badge}`}
            >
              {estado.label}
            </p>
          </div>
        </div>
        <p className="mt-3 text-center text-sm font-medium text-slate-700">{estado.description}</p>
      </section>

      <section className="relative mt-5 flex items-center justify-center rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 py-7">
        {photoUrl ? (
          <div className="relative h-36 w-28 overflow-hidden rounded-xl border-2 border-slate-200 shadow-md">
            <Image
              src={photoUrl}
              alt=""
              fill
              className="object-cover"
              sizes="112px"
              unoptimized
              priority
            />
          </div>
        ) : (
          <Image
            src="/logos/liga.png"
            alt="Liga"
            width={140}
            height={140}
            className="object-contain opacity-95"
            priority
          />
        )}
      </section>

      <section className="mt-6 space-y-3.5 text-base">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Deportista
          </p>
          <p className="mt-1.5 text-xl font-bold uppercase leading-tight text-slate-900">
            {playerName}
          </p>
        </div>

        {(poloLine || carnetLine) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {poloLine ? (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  N° polo
                </p>
                <p className="mt-1.5 font-mono text-lg font-bold text-slate-900">{poloLine}</p>
              </div>
            ) : null}
            {carnetLine ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600">
                  N° carnet
                </p>
                <p className="mt-1.5 font-mono text-lg font-bold text-blue-900">{carnetLine}</p>
              </div>
            ) : null}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Club</p>
          <p className="mt-1.5 text-lg font-semibold uppercase text-slate-900">{clubName}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Categoría</p>
          <p className="mt-1.5 text-lg font-semibold uppercase text-slate-900">{categoriaNombre}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Consulta en tiempo real
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">{verifiedAtLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            Vuelva a escanear el QR para actualizar el estado.
          </p>
        </div>
      </section>
    </div>
  );
}
