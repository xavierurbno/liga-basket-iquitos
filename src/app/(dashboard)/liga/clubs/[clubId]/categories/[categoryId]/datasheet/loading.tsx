export default function FichaDatasheetLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6" aria-busy="true" aria-label="Cargando ficha">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-10 w-44 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-10 w-36 animate-pulse rounded-lg bg-blue-200/70" />
      </div>
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mx-auto h-6 w-3/4 max-w-md animate-pulse rounded bg-slate-200" />
        <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-48 w-full animate-pulse rounded-lg bg-slate-50" />
      </div>
      <p className="text-center text-xs font-medium text-slate-500">Preparando ficha de inscripción…</p>
    </div>
  );
}
