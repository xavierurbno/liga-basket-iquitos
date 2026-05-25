import Link from "next/link";
import type { CarnetReadinessWarning } from "@/lib/carnet/carnetLeagueReadiness";

type Props = {
  warnings: CarnetReadinessWarning[];
  settingsHref?: string;
  title?: string;
  className?: string;
};

export function CarnetConfigAlert({
  warnings,
  settingsHref = "/liga/configuracion/#carnet-settings",
  title = "Configuración del carnet",
  className = "",
}: Props) {
  if (warnings.length === 0) return null;

  const hasBlocking = warnings.some((w) => w.severity === "warning");

  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 text-sm ${
        hasBlocking
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-blue-100 bg-blue-50 text-blue-950"
      } ${className}`}
      role="status"
    >
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-xs opacity-90">
        Puedes descargar el PDF igual; estos puntos mejoran el reverso y la impresión oficial.
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs font-medium">
        {warnings.map((w) => (
          <li key={w.id}>{w.message}</li>
        ))}
      </ul>
      <Link
        href={settingsHref}
        className="mt-3 inline-flex text-xs font-bold underline underline-offset-2 hover:no-underline"
      >
        Ir a configuración del carnet →
      </Link>
    </div>
  );
}
