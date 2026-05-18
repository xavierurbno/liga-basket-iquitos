export function PublicTournamentsSkeleton() {
  return (
    <section className="mt-8 animate-pulse" aria-hidden>
      <div className="mb-4 space-y-2">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-7 w-48 rounded bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-36 rounded-2xl border border-slate-100 bg-white" />
        ))}
      </div>
    </section>
  );
}
