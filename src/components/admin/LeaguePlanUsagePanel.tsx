import type { LeaguePlanUsage } from "@/repositories/leaguePlanRepository";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

function usagePct(used: number, max: number): number {
  if (max <= 0) return 100;
  return Math.min(100, Math.round((used / max) * 100));
}

function barColor(pct: number): string {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 85) return "bg-amber-500";
  return "bg-emerald-500";
}

type Props = {
  usage: LeaguePlanUsage;
};

export function LeaguePlanUsagePanel({ usage }: Props) {
  const { plan, playerCount, activeTournamentCount } = usage;
  const playersPct = usagePct(playerCount, plan.maxPlayers);
  const tournamentsPct = usagePct(activeTournamentCount, plan.maxActiveTournaments);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#005CEE]">
            Plan y límites
          </p>
          <h3 className="mt-2 text-lg font-black text-slate-900">
            {PLAN_LABELS[plan.plan] ?? plan.plan}
          </h3>
          {plan.trialExpiresAt ? (
            <p className="mt-1 text-xs font-medium text-slate-500">
              Trial hasta{" "}
              {new Date(plan.trialExpiresAt).toLocaleDateString("es-PE", {
                dateStyle: "medium",
              })}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <UsageBar
          label="Jugadores registrados"
          used={playerCount}
          max={plan.maxPlayers}
          pct={playersPct}
        />
        <UsageBar
          label="Torneos activos"
          used={activeTournamentCount}
          max={plan.maxActiveTournaments}
          pct={tournamentsPct}
        />
      </div>
    </section>
  );
}

function UsageBar({
  label,
  used,
  max,
  pct,
}: {
  label: string;
  used: number;
  max: number;
  pct: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-mono text-xs text-slate-500">
          {used} / {max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
