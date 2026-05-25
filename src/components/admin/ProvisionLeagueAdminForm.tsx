"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { provisionLeagueAdminFromFichaAction } from "@/actions/leagues";

export function ProvisionLeagueAdminForm({
  leagueId,
  leagueName,
}: {
  leagueId: string;
  leagueName: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(provisionLeagueAdminFromFichaAction, {});

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error);
    }
    if (state.success && state.message) {
      toast.success(state.message);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="leagueId" value={leagueId} />
      <p className="text-sm font-medium text-slate-600">
        Asigna un <strong className="text-slate-800">LEAGUE_ADMIN</strong> para{" "}
        <strong className="text-slate-800">{leagueName}</strong> (liga fijada, sin elegir otra).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Nombre completo
          </label>
          <input
            name="adminFullName"
            type="text"
            required
            minLength={3}
            disabled={isPending}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#005CEE]"
          />
        </div>
        <div className="space-y-2">
          <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Correo
          </label>
          <input
            name="adminEmail"
            type="email"
            required
            disabled={isPending}
            placeholder="admin@liga.pe"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#005CEE]"
          />
        </div>
      </div>
      <p className="text-xs font-medium text-slate-500">
        Si el correo no existe en el sistema, se envía invitación de Supabase para activar la cuenta.
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex rounded-xl bg-[#005CEE] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#004bb5] disabled:opacity-60"
      >
        {isPending ? "Asignando…" : "Crear administrador de liga"}
      </button>
    </form>
  );
}
