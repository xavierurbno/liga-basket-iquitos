"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { setActiveLeagueAction } from "@/actions/active-league.actions";

export type ActiveLeagueOption = { id: string; name: string };

export function ActiveLeagueSelector({
  leagues,
  activeLeagueId,
  compact = false,
}: {
  leagues: ActiveLeagueOption[];
  activeLeagueId: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={
        compact
          ? "flex min-w-0 flex-col gap-0.5"
          : "flex w-full max-w-md flex-col gap-1.5"
      }
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Liga activa
      </span>
      <select
        disabled={pending || leagues.length === 0}
        value={activeLeagueId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          startTransition(async () => {
            const res = await setActiveLeagueAction(value || null);
            if (!res.success) return;
            const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            );
            await supabase.auth.refreshSession();
            router.refresh();
          });
        }}
        className={
          compact
            ? "max-w-[220px] truncate rounded-lg border border-[#BFDBFE] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm disabled:opacity-60"
            : "rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm disabled:opacity-60"
        }
      >
        <option value="">— Seleccionar liga —</option>
        {leagues.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
