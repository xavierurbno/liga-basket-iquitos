"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createStripeCheckoutAction,
  createStripePortalAction,
} from "@/lib/actions/billing.actions";

type Props = {
  leagueId: string;
  planLabel: string;
  hasSubscription: boolean;
  success?: boolean;
  canceled?: boolean;
};

export function BillingCheckoutPanel({
  leagueId,
  planLabel,
  hasSubscription,
  success,
  canceled,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startCheckout() {
    setError(null);
    startTransition(async () => {
      const result = await createStripeCheckoutAction({ leagueId });
      if (!result.success || !result.url) {
        setError(result.error ?? "No se pudo iniciar el pago.");
        return;
      }
      window.location.href = result.url;
    });
  }

  function openPortal() {
    setError(null);
    startTransition(async () => {
      const result = await createStripePortalAction();
      if (!result.success || !result.url) {
        setError(result.error ?? "No se pudo abrir el portal.");
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="space-y-4">
      {success ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Pago completado. Tu plan {planLabel} se activará en unos segundos.
        </p>
      ) : null}
      {canceled ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Checkout cancelado. Puedes reintentar cuando quieras.
        </p>
      ) : null}

      <p className="text-sm text-slate-600">
        Plan <strong>{planLabel}</strong> — pago recurrente mensual vía Stripe.
      </p>

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      {!hasSubscription ? (
        <button
          type="button"
          onClick={startCheckout}
          disabled={isPending}
          className="w-full rounded-xl bg-[#005CEE] py-3 text-sm font-bold text-white hover:bg-[#004bb8] disabled:opacity-60"
        >
          {isPending ? "Redirigiendo…" : "Ir a Stripe Checkout"}
        </button>
      ) : (
        <button
          type="button"
          onClick={openPortal}
          disabled={isPending}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-800 hover:border-[#005CEE] disabled:opacity-60"
        >
          Gestionar suscripción
        </button>
      )}

      <Link
        href="/liga/"
        className="block text-center text-sm font-semibold text-[#005CEE] hover:underline"
      >
        Ir al panel de la liga
      </Link>
    </div>
  );
}
