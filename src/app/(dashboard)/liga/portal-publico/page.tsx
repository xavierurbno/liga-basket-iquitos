import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { canManageTournaments } from "@/lib/auth/resolve-league-id";
import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { listTournamentsForPortalAdmin } from "@/lib/tournaments/queries";
import { PortalPublicoTournamentsClient } from "@/components/tournaments/PortalPublicoTournamentsClient";
import { SelectActiveLeaguePrompt } from "@/components/liga/SelectActiveLeaguePrompt";

function resolveSiteOrigin(headerList: Headers): string {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3001";
}

export default async function LigaPortalPublicoPage() {
  const ctx = await getLigaOperationalContext();
  if (!canManageTournaments(ctx.role)) redirect("/liga/");

  if (ctx.needsLeagueSelection) {
    return (
      <SelectActiveLeaguePrompt
        role={ctx.role}
        leagues={ctx.leagues}
        activeLeagueId={ctx.leagueId}
        title="Selecciona una liga"
        description="Elige la liga cuyos campeonatos quieres mostrar en el portal público."
      />
    );
  }

  const leagueId = ctx.leagueId!;
  const tournaments = await listTournamentsForPortalAdmin(leagueId);
  const headerList = await headers();
  const siteOrigin = resolveSiteOrigin(headerList);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/liga/" className="text-xs font-medium text-[#1B3A6B] hover:underline">
          ← Gestión de la liga
        </Link>
        <h1 className="mt-2 text-2xl font-black text-[#0f2040]">Portal y campeonatos</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Controla qué torneos aparecen en la portada pública y comparte el enlace del fixture. Para
          cargar resultados y editar el calendario, usa{" "}
          <Link href="/liga/torneos/" className="font-semibold text-[#1B3A6B] underline">
            Torneos
          </Link>
          .
        </p>
      </header>

      <PortalPublicoTournamentsClient
        tournaments={tournaments}
        leagueName={ctx.leagueName ?? "Liga"}
        siteOrigin={siteOrigin}
      />
    </div>
  );
}
