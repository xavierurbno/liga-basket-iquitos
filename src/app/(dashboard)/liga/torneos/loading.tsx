export default function TorneosLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 rounded-lg bg-slate-200" />
      <div className="h-4 w-72 rounded bg-slate-100" />
      <div className="space-y-2 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl border border-slate-100 bg-white" />
        ))}
      </div>
    </div>
  );
}
