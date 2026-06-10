"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createLeagueOnboardingAction,
  type OnboardingLeagueState,
} from "@/lib/actions/onboarding.actions";

const defaultSeason = () => `Temporada ${new Date().getFullYear()}`;

type Props = {
  planLabel: string;
};

export function OnboardingLeagueForm({ planLabel }: Props) {
  const [state, formAction, isPending] = useActionState<
    OnboardingLeagueState,
    FormData
  >(createLeagueOnboardingAction, {});

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(false);

  useEffect(() => {
    if (manualSlug) return;
    setSlug(
      name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .slice(0, 50),
    );
  }, [name, manualSlug]);

  return (
    <form action={formAction} className="space-y-5">
      <p className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900">
        Plan seleccionado: <strong>{planLabel}</strong>
      </p>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Nombre de la liga</span>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">URL pública (slug)</span>
        <input
          name="slug"
          value={slug}
          onChange={(e) => {
            setManualSlug(true);
            setSlug(e.target.value);
          }}
          required
          pattern="[a-z0-9-]+"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
        />
      </label>

      <input type="hidden" name="seasonName" value={defaultSeason()} />
      <input type="hidden" name="leagueKind" value="tournament" />

      {state.errors?.slug ? (
        <p className="text-sm font-semibold text-red-600">{state.errors.slug[0]}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-semibold text-red-600">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#005CEE] py-3 text-sm font-bold text-white hover:bg-[#004bb8] disabled:opacity-60"
      >
        {isPending ? "Creando liga…" : "Crear mi liga"}
      </button>
    </form>
  );
}
