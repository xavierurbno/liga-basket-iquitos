"use client";

import { useActionState } from "react";
import {
  updateLeaguePlanAction,
  type UpdateLeaguePlanState,
} from "@/lib/actions/league-plan.actions";
import type { LeaguePlan } from "@/lib/db/schema";
import { toDatetimeLocalInputValue } from "@/lib/leagues/datetime-local-input";

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
] as const;

type Props = {
  leagueId: string;
  initialPlan: LeaguePlan;
};

export function LeaguePlanForm({ leagueId, initialPlan }: Props) {
  const [state, formAction, isPending] = useActionState<
    UpdateLeaguePlanState,
    FormData
  >(updateLeaguePlanAction, {});

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">Editar plan (manual)</h3>
      <p className="mt-1 text-sm text-slate-500">
        Override sin Stripe. Los límites aplican al registrar jugadores y crear torneos.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="leagueId" value={leagueId} />

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Plan</span>
          <select
            name="plan"
            defaultValue={initialPlan.plan}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {PLAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Máx. jugadores
            </span>
            <input
              type="number"
              name="maxPlayers"
              min={1}
              max={100000}
              defaultValue={initialPlan.maxPlayers}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Máx. torneos activos
            </span>
            <input
              type="number"
              name="maxActiveTournaments"
              min={1}
              max={500}
              defaultValue={initialPlan.maxActiveTournaments}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Fin de trial (opcional)
          </span>
          <input
            type="datetime-local"
            name="trialExpiresAt"
            defaultValue={
              initialPlan.trialExpiresAt
                ? toDatetimeLocalInputValue(initialPlan.trialExpiresAt)
                : ""
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        {state.error ? (
          <p className="text-sm font-semibold text-red-600">{state.error}</p>
        ) : null}
        {state.success && state.message ? (
          <p className="text-sm font-semibold text-emerald-600">{state.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#005CEE] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#004bb8] disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar plan"}
        </button>
      </form>
    </section>
  );
}
