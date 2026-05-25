import Link from "next/link";

/** Portal sin `leagueId` (BD inaccesible, timeout o sin ligas registradas). */
export function PortalLeagueUnavailable({ detail }: { detail?: string }) {
  return (
    <section
      className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center"
      role="alert"
    >
      <h2 className="text-lg font-bold text-slate-900">No pudimos cargar el contenido de la liga</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
        La conexión con la base de datos no respondió o no hay una liga configurada. En
        desarrollo, reinicia <code className="rounded bg-white px-1 text-xs">npm run dev</code> tras
        cambiar el pool. En Vercel usa la URI del <strong>pooler</strong> (puerto 6543). Opcional:{" "}
        <code className="rounded bg-white px-1 text-xs">NEXT_PUBLIC_DEFAULT_LEAGUE_ID</code> en{" "}
        <code className="rounded bg-white px-1 text-xs">.env.local</code>.
      </p>
      {detail ? (
        <p className="mx-auto mt-3 max-w-lg rounded-lg bg-white/80 px-3 py-2 text-left text-xs text-amber-950">
          {detail}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-[#005CEE] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0049c4]"
        >
          Reintentar
        </Link>
        <Link
          href="/login/"
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Intranet
        </Link>
      </div>
    </section>
  );
}
