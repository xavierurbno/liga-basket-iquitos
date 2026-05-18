"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PublicPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public-portal]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">No pudimos cargar esta página</h1>
        <p className="text-sm text-slate-600">
          Puede deberse a una conexión lenta con la base de datos. Intenta de nuevo en unos
          segundos.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[#005CEE] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0049c4]"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
