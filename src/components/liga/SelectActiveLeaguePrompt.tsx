import Link from "next/link";
import { ActiveLeagueSelector, type ActiveLeagueOption } from "@/components/liga/ActiveLeagueSelector";

type Props = {
  role: string | undefined;
  leagues: ActiveLeagueOption[];
  activeLeagueId?: string | null;
  title?: string;
  description?: string;
};

export function SelectActiveLeaguePrompt({
  role,
  leagues,
  activeLeagueId = null,
  title = "Selecciona una liga",
  description,
}: Props) {
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[#BFDBFE] bg-white p-8 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#005CEE]">
        Contexto de liga
      </p>
      <h2 className="mt-2 text-xl font-black text-[#0f2040]">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {description ??
          (isSuperAdmin
            ? "Como super administrador debes elegir en qué liga quieres operar (torneos, clubes filtrados, patrocinadores, etc.). El contexto se guarda en tu sesión del navegador."
            : "Tu cuenta de administrador de liga no tiene una liga asignada. Pide a un super administrador que te configure en Perfiles.")}
      </p>

      {isSuperAdmin ? (
        <div className="mt-6 space-y-4">
          {leagues.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No hay ligas registradas.{" "}
              <Link href="/super-admin/leagues" className="font-semibold text-[#005CEE] underline">
                Crea la primera liga
              </Link>
              .
            </p>
          ) : (
            <ActiveLeagueSelector
              leagues={leagues}
              activeLeagueId={activeLeagueId}
            />
          )}
          <p className="text-xs text-slate-500">
            También puedes cambiar la liga activa desde el selector en la{" "}
            <strong>barra superior del panel</strong> (visible en todas las páginas de{" "}
            <strong>/liga</strong>).
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm">
          <Link href="/liga/perfiles/" className="font-semibold text-[#005CEE] underline">
            Ir a Perfiles
          </Link>{" "}
          (solo si tienes permisos de gestión de usuarios).
        </p>
      )}
    </div>
  );
}
