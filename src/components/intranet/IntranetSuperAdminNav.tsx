"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";

export type IntranetNavLeague = { id: string; name: string; slug: string };
export type IntranetNavClub = { id: string; name: string; slug: string };

export function IntranetSuperAdminNav({
  leagues,
  clubs,
}: {
  leagues: IntranetNavLeague[];
  clubs: IntranetNavClub[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-4 border-t border-slate-200 pt-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ligas</p>
        <Link
          href="/liga/"
          className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
        >
          Ver todas las ligas (panel global)
        </Link>
        <p className="mt-2 text-xs text-slate-500">Acceso por liga (vista pública / marca)</p>
        <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-sm">
          {leagues.map((l) => (
            <li key={l.id}>
              <Link
                href={leaguePortalHome(l.slug)}
                className="block truncate text-[#005CEE] hover:underline"
              >
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clubes</p>
        <label htmlFor="intranet-club-jump" className="mt-1 block text-xs text-slate-500">
          Cambiar de club (portal del club)
        </label>
        <select
          id="intranet-club-jump"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          onChange={(e) => {
            const id = e.target.value;
            if (!id) return;
            router.push(`/liga/clubs/${id}/`);
          }}
        >
          <option value="">Seleccionar club…</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
