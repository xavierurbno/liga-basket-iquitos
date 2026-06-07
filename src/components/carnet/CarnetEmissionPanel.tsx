"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { asignarNumeroCarnetAction, emitirCarnetAction } from "@/lib/actions/carnet-emission";
import { GenerateCarnetPDF } from "@/components/carnet/GenerateCarnetPDF";
import type { GenerateCarnetPDFProps } from "@/lib/types/carnet";

type CarnetEmissionPanelProps = {
  playerId: string;
  clubId: string;
  categoryId: string;
  credentialVersion: number;
  credentialIssuedAt: string | null;
  validationUrl: string | null;
  canEmit: boolean;
  emitBlockReason?: string | null;
  needsCarnetNumber?: boolean;
  pdfProps: GenerateCarnetPDFProps;
};

function formatEmissionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CarnetEmissionPanel({
  playerId,
  clubId,
  categoryId,
  credentialVersion: initialVersion,
  credentialIssuedAt: initialIssuedAt,
  validationUrl,
  canEmit,
  emitBlockReason,
  needsCarnetNumber = false,
  pdfProps,
}: CarnetEmissionPanelProps) {
  const router = useRouter();
  const [assigningNumber, setAssigningNumber] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [version, setVersion] = useState(initialVersion);
  const [issuedAt, setIssuedAt] = useState(initialIssuedAt);
  const [carnetNumberDisplay, setCarnetNumberDisplay] = useState(
    pdfProps.carnetNumberDisplay ?? pdfProps.carnetNumber,
  );

  const isEmitted = version > 0 && Boolean(issuedAt);

  async function handleAssignNumber() {
    setAssigningNumber(true);
    setError(null);
    try {
      const res = await asignarNumeroCarnetAction(playerId, clubId, categoryId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.created) setCarnetNumberDisplay(res.carnetNumber);
      router.refresh();
    } finally {
      setAssigningNumber(false);
    }
  }

  async function handleEmit() {
    setEmitting(true);
    setError(null);
    try {
      const res = await emitirCarnetAction(playerId, clubId, categoryId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setVersion(res.credentialVersion);
      setIssuedAt(res.credentialIssuedAt);
      if (res.carnetNumber) setCarnetNumberDisplay(res.carnetNumber);
      router.refresh();
    } finally {
      setEmitting(false);
    }
  }

  async function handleCopyLink() {
    if (!validationUrl) return;
    try {
      await navigator.clipboard.writeText(validationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("No se pudo copiar el enlace. Cópialo manualmente.");
    }
  }

  const pdfPropsWithEmission: GenerateCarnetPDFProps = {
    ...pdfProps,
    carnetNumber: carnetNumberDisplay ?? pdfProps.carnetNumber,
    carnetNumberDisplay: carnetNumberDisplay ?? pdfProps.carnetNumberDisplay,
    validationUrl: validationUrl ?? pdfProps.validationUrl,
    credentialVersion: version,
    credentialIssuedAtIso: issuedAt,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#BFDBFE] bg-linear-to-b from-blue-50/60 to-white p-5">
        <h2 className="text-sm font-bold text-slate-900">1. Emisión digital en sistema</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Registra el carnet en la plataforma antes de imprimir. El QR de validación es el mismo en
          pantalla, PDF y mesa de control.
        </p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
          {isEmitted ? (
            <div className="space-y-1">
              <p className="font-semibold text-emerald-800">Carnet emitido</p>
              <p className="text-xs text-slate-600">
                Versión <span className="font-mono font-semibold">{version}</span>
                {" · "}
                {formatEmissionDate(issuedAt!)}
              </p>
            </div>
          ) : (
            <p className="text-xs font-medium text-amber-800">
              Pendiente de emisión. El PDF para impresión se habilita después de emitir.
            </p>
          )}
        </div>

        {error ? (
          <p className="mt-3 text-xs font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {needsCarnetNumber && canEmit ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-900">
            <p>
              Este jugador no tiene número de carnet en la base de datos (el{" "}
              <strong>DNI en la vista previa no es el número de carnet</strong>). Puedes generarlo
              ahora o al emitir.
            </p>
            <button
              type="button"
              onClick={() => {
                void handleAssignNumber();
              }}
              disabled={assigningNumber}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assigningNumber ? "Generando número…" : "Generar número de carnet"}
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleEmit();
          }}
          disabled={emitting || !canEmit}
          className="mt-4 w-full rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {emitting
            ? "Registrando emisión…"
            : isEmitted
              ? "Re-emitir carnet (nueva versión)"
              : "Emitir carnet digital"}
        </button>

        {!canEmit && emitBlockReason ? (
          <p className="mt-2 text-center text-[11px] text-amber-800">{emitBlockReason}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">2. Impresión PDF (opcional)</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Descarga el carnet en CR80 para EcoTank, imprenta o futura impresora Zebra PVC. Usa el
          mismo QR estático que la validación en cancha.
        </p>
        <div className="mt-4">
          <GenerateCarnetPDF
            {...pdfPropsWithEmission}
            label={isEmitted ? "Descargar carnet PDF" : "Descargar PDF (requiere emisión)"}
            disabled={!isEmitted}
            className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5">
        <h2 className="text-sm font-bold text-slate-900">3. Compartir con padre o tutor (opcional)</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Enlace de validación pública para consulta en cancha. En una fase posterior se habilitará
          el carnet digital del padre en <code className="rounded bg-white px-1">/mi-carnet/</code>.
        </p>
        {validationUrl ? (
          <div className="mt-4 space-y-2">
            <p className="break-all rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[10px] text-slate-700">
              {validationUrl}
            </p>
            <button
              type="button"
              onClick={() => {
                void handleCopyLink();
              }}
              disabled={!isEmitted}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copied ? "Enlace copiado" : "Copiar enlace de validación"}
            </button>
            {!isEmitted ? (
              <p className="text-center text-[10px] text-slate-500">
                Disponible tras emitir el carnet en el sistema.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-xs text-amber-800">
            No se pudo generar el enlace. Revisa NEXT_PUBLIC_SITE_URL y VALIDATION_TOKEN_SECRET.
          </p>
        )}
      </section>
    </div>
  );
}
