"use client";

import { useState, useTransition } from "react";
import { crearClubComoPropietarioAction } from "@/lib/actions/clubs";

export function CrearClubPropietario() {
  const [name, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await crearClubComoPropietarioAction(formData);
      if (res && !res.success) setError(res.error);
    });
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-left dark:border-emerald-900 dark:bg-emerald-950/30">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Propietario del sistema
      </p>
      <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
        Crear club / liga en la base de datos
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Se crea el registro en <code className="rounded bg-white px-1 dark:bg-slate-900">clubs</code>, te
        asigna como <strong>ADMIN</strong> en{" "}
        <code className="rounded bg-white px-1 dark:bg-slate-900">club_members</code> y entras al panel
        (mismos permisos que un administrador del club).
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(new FormData(e.currentTarget));
        }}
      >
        <div>
          <label htmlFor="name-club" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Nombre del club (opcional)
          </label>
          <input
            id="name-club"
            name="name"
            value={name}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Liga Municipal Iquitos"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {pending ? "Creando…" : "Crear y entrar al panel"}
        </button>
      </form>

      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(new FormData());
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl border border-emerald-700 bg-white py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
        >
          {pending ? "Creando…" : "Un solo clic — name automático"}
        </button>
      </form>
    </div>
  );
}
