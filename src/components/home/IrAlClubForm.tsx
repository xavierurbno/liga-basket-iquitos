"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Permite abrir `/{slug}` cuando aún no hay fila en `club_members` pero conoces el slug. */
export function IrAlClubForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  function ir(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const s = slug.trim().replace(/^\/+/, "").split("/")[0];
    if (!s) {
      setError("Escribe el identificador del club (slug).");
      return;
    }
    router.push(`/${encodeURIComponent(s)}`);
  }

  return (
    <form onSubmit={ir} className="mx-auto mt-8 flex max-w-md flex-col gap-3">
      <label htmlFor="club-slug" className="text-left text-sm text-slate-600 dark:text-slate-400">
        Si conoces la URL del club (ej. <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">mi-liga</code>):
      </label>
      <div className="flex gap-2">
        <span className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900">
          /
        </span>
        <input
          id="club-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="mi-liga"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Ir
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
