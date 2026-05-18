"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { UserAccountMenu } from "@/components/nav/UserAccountMenu";
import { LeagueHeaderLogo } from "@/components/ui/LeagueHeaderLogo";
const navBtn =
  "inline-flex items-center justify-center rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-bold tracking-wide text-slate-600 transition hover:border-[#005CEE] hover:text-[#005CEE]";
const navBtnActive =
  "inline-flex items-center justify-center rounded-xl border border-[#005CEE] bg-[#005CEE] px-3 py-2 text-xs font-bold tracking-wide text-white shadow-[0_10px_20px_-10px_rgba(0,92,238,0.7)]";

function isLigaOperativoPath(pathname: string) {
  return pathname === "/liga" || pathname === "/liga/" || pathname.startsWith("/liga/");
}

/** Barra /liga: accesos duplicados de las tarjetas del panel se quitan; rutas vía `/liga` o cards. */
export function LigaOperationalNav({
  userEmail,
  intranetNavLabel,
}: {
  userEmail: string | null;
  intranetNavLabel: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="relative flex w-full min-h-12 flex-wrap items-center justify-between gap-3 md:min-h-13">
      <div className="relative z-20 flex min-w-0 flex-wrap items-center gap-3 lg:gap-4">
        <LeagueHeaderLogo size="compact" className="min-w-0" />
      </div>

      <div className="relative z-20 flex w-full flex-wrap items-center justify-end gap-2 border-t border-[#BFDBFE] pt-3 sm:w-auto sm:border-t-0 sm:pt-0 lg:w-auto">
        {intranetNavLabel ? (
          <Link
            href="/liga/"
            className={isLigaOperativoPath(pathname) ? navBtnActive : navBtn}
            title="Panel operativo — gestión de la liga"
          >
            <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 shrink-0" aria-hidden />
            {intranetNavLabel.toUpperCase()}
          </Link>
        ) : null}
        <UserAccountMenu email={userEmail} profileHref="/liga/" />
      </div>
    </div>
  );
}
