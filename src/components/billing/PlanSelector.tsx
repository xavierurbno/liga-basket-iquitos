"use client";

import type { PlanDefinition } from "@/lib/billing/plan-catalog";

type Props = {
  plans: PlanDefinition[];
  name?: string;
  defaultTier?: string;
};

export function PlanSelector({ plans, name = "plan", defaultTier = "free" }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {plans.map((plan) => (
        <label
          key={plan.tier}
          className={`relative cursor-pointer rounded-2xl border p-4 transition has-checked:border-[#005CEE] has-checked:ring-2 has-checked:ring-[#005CEE]/20 ${
            plan.highlighted ? "border-[#005CEE]/40 bg-blue-50/50" : "border-slate-200 bg-white"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={plan.tier}
            defaultChecked={plan.tier === defaultTier}
            className="sr-only"
          />
          {plan.highlighted ? (
            <span className="absolute -top-2 right-3 rounded-full bg-[#005CEE] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Popular
            </span>
          ) : null}
          <p className="text-sm font-black text-slate-900">{plan.label}</p>
          <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
          <ul className="mt-3 space-y-1 text-xs font-medium text-slate-600">
            <li>{plan.maxPlayers} jugadores</li>
            <li>{plan.maxActiveTournaments} torneos activos</li>
            {plan.trialDays > 0 ? <li>{plan.trialDays} días de prueba</li> : null}
          </ul>
        </label>
      ))}
    </div>
  );
}
