const LABELS: Record<string, string> = {
  draft: "Borrador",
  active: "En curso",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-emerald-100 text-emerald-800",
  finished: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-700",
};

export function TournamentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? STYLES.draft}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
