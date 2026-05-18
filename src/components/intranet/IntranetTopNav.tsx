"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, LayoutDashboard } from "lucide-react";
import { UserAccountMenu } from "@/components/nav/UserAccountMenu";
import { LeagueHeaderLogo } from "@/components/ui/LeagueHeaderLogo";
import type { IntranetNavClub, IntranetNavLeague } from "@/components/intranet/IntranetSuperAdminNav";
import type { IntranetRole } from "@/lib/auth/intranet-roles";
const navBtn =
  "inline-flex items-center justify-center rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-bold tracking-wide text-slate-600 transition hover:border-[#005CEE] hover:text-[#005CEE]";
const navBtnActive =
  "inline-flex items-center justify-center rounded-xl border border-[#005CEE] bg-[#005CEE] px-3 py-2 text-xs font-bold tracking-wide text-white shadow-[0_10px_20px_-10px_rgba(0,92,238,0.7)]";

function stripTrailing(path: string): string {
  if (path === "/" || path === "") return "/";
  return path.replace(/\/+$/, "") || "/";
}

function isActive(pathname: string, href: string) {
  const p = stripTrailing(pathname);
  const h = stripTrailing(href);
  if (h === "/normativas") return p === "/normativas" || p.startsWith("/normativas/");
  if (h === "/dashboard") return p === "/dashboard" || p.startsWith("/dashboard/");
  return p === h || p.startsWith(`${h}/`);
}

export function IntranetTopNav({
  role,
  userEmail,
  clubSlug,
  clubId,
  leagues,
  clubs,
  activeLeagueId,
  activeLeagueName,
}: {
  role: IntranetRole;
  userEmail: string | null;
  clubSlug: string | null;
  clubId: string | null;
  leagues?: IntranetNavLeague[];
  clubs?: IntranetNavClub[];
  activeLeagueId?: string | null;
  activeLeagueName?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const showSuperRow = role === "SUPER_ADMIN" && leagues && clubs;

  const clubesHref =
    role === "CLUB_DELEGATE" && clubId
      ? `/liga/clubs/${clubId}`
      : "/liga/clubs";

  const mainLinks: { href: string; label: string }[] = [
    { href: "/normativas/", label: "Administración" },
    { href: clubesHref, label: "Clubes" },
    { href: "/liga/tesoreria", label: "Caja" },
    { href: "/liga/torneos", label: "Torneos" },
  ];

  const filteredMain = mainLinks.filter((item) => {
    if (role === "CLUB_DELEGATE" && item.label === "Torneos") return false;
    if (role === "CLUB_DELEGATE" && item.label === "Administración") return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-40 border-b border-[#BFDBFE] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
        <div className="relative flex min-h-36 flex-wrap items-center justify-between gap-3">
          <div className="relative z-20 flex min-w-0 flex-wrap items-center gap-3">
            <LeagueHeaderLogo size="hero" priority className="min-w-0" />
            <nav className="flex flex-wrap items-center gap-2" aria-label="Operación">
              {filteredMain.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(pathname, item.href) ? navBtnActive : navBtn}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="relative z-20 flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/normativas/"
              className={isActive(pathname, "/normativas/") ? navBtnActive : navBtn}
            >
              <FileText className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
              Normativas
            </Link>
            {clubId ? (
              <Link href={`/liga/clubs/${clubId}/`} className={navBtn}>
                <LayoutDashboard className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                Mi club
              </Link>
            ) : null}
            <UserAccountMenu email={userEmail} profileHref="/liga/" />
          </div>
        </div>

        {showSuperRow ? (
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="font-semibold uppercase tracking-wide text-slate-500">Super admin</span>
              <Link href="/liga/" className="font-medium text-[#005CEE] hover:underline">
                Panel operativo
              </Link>
              <Link
                href="/super-admin/leagues"
                className="font-medium text-slate-600 hover:text-[#005CEE] hover:underline"
              >
                Gestionar ligas
              </Link>
              <span className="text-slate-300">·</span>
              <span className="hidden sm:inline">Portal público</span>
              <select
                aria-label="Ir a liga pública"
                className="max-w-[200px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                defaultValue=""
                onChange={(e) => {
                  const slug = e.target.value;
                  if (!slug) return;
                  router.push(`/?l=${encodeURIComponent(slug)}`);
                }}
              >
                <option value="">Ver en web…</option>
                {leagues!.map((l) => (
                  <option key={l.id} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="intranet-top-club" className="text-xs text-slate-500">
                Club
              </label>
              <select
                id="intranet-top-club"
                className="max-w-[220px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
                defaultValue=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  router.push(`/liga/clubs/${id}/`);
                }}
              >
                <option value="">Ir al club…</option>
                {clubs!.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
