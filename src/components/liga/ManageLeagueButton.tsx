"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { setActiveLeagueAction } from "@/actions/active-league.actions";

export function ManageLeagueButton({
  leagueId,
  className,
  label = "Administrar esta liga",
}: {
  leagueId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await setActiveLeagueAction(leagueId);
          if (!res.success) {
            toast.error(res.error);
            return;
          }
          toast.success("Liga activa actualizada");
          router.push("/liga/");
          router.refresh();
        });
      }}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl bg-[#1B3A6B] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#0f2040] disabled:opacity-60"
      }
    >
      {pending ? "Abriendo…" : label}
    </button>
  );
}
