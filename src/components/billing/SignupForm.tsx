"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupWithPlanAction, type SignupActionState } from "@/lib/actions/billing.actions";
import { PlanSelector } from "@/components/billing/PlanSelector";
import type { PlanDefinition } from "@/lib/billing/plan-catalog";

type Props = {
  plans: PlanDefinition[];
  inviteToken?: string;
  signupEnabled: boolean;
};

export function SignupForm({ plans, inviteToken, signupEnabled }: Props) {
  const [state, formAction, isPending] = useActionState<SignupActionState, FormData>(
    signupWithPlanAction,
    {},
  );

  if (!signupEnabled) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
        El registro público está desactivado. Contacta al administrador de la plataforma.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}

      <PlanSelector plans={plans} defaultTier="free" />

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Nombre completo</span>
        <input
          name="fullName"
          required
          minLength={3}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Correo</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      {state.error ? (
        <p className="text-sm font-semibold text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#005CEE] py-3 text-sm font-bold text-white hover:bg-[#004bb8] disabled:opacity-60"
      >
        {isPending ? "Creando cuenta…" : "Continuar"}
      </button>

      <p className="text-center text-xs text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login/" className="font-semibold text-[#005CEE] hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
