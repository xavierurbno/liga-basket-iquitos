"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ClubContext } from "@/app/(dashboard)/[clubSlug]/layout";
import type { User } from "@supabase/supabase-js";
import { UserAccountMenu } from "@/components/nav/UserAccountMenu";
import { OFFICIAL_LEAGUE_NAME_UPPER } from "@/lib/league-branding";

const navBtn =
  "inline-flex items-center justify-center rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-bold tracking-wide text-slate-700 transition hover:border-[#005CEE] hover:text-[#005CEE]";
const navBtnActive =
  "inline-flex items-center justify-center rounded-xl border border-[#005CEE] bg-[#005CEE] px-3 py-2 text-xs font-bold tracking-wide text-white shadow-[0_10px_20px_-10px_rgba(0,92,238,0.55)]";

function isActive(pathname: string, base: string, href: string) {
  if (href === base) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ClubOperationalHeader({
  club,
  user,
}: {
  club: ClubContext;
  user: User;
}) {
  const pathname = usePathname();
  const base = `/${club.slug}`;
  const clubesHref = `/liga/clubs/${club.id}`;
  const nav = [
    { href: base, label: "Dashboard" },
    { href: clubesHref, label: "Clubes", match: "clubes" as const },
    { href: `${base}/caja`, label: "Caja", match: "path" as const },
    { href: `${base}/torneos`, label: "Torneos", match: "path" as const },
    { href: `${base}/configuracion`, label: "Configuración", match: "path" as const },
  ];

  function navClass(item: (typeof nav)[number]) {
    const active =
      item.match === "clubes"
        ? pathname.startsWith(`/liga/clubs/${club.id}`)
        : isActive(pathname, base, item.href);
    return active ? navBtnActive : navBtn;
  }

  return (
    <header
      className="shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      style={
        {
          "--nav-accent": club.colorPrimario,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold text-white shadow-sm"
            style={{ backgroundColor: "var(--club-primary, #1e3a5f)" }}
          >
            {club.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              club.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{club.name}</p>
            <p className="mt-0.5 hidden max-w-xl truncate text-[10px] font-bold uppercase tracking-wide text-slate-600 md:block dark:text-slate-400">
              {OFFICIAL_LEAGUE_NAME_UPPER}
            </p>
            <p className="text-[11px] text-slate-500">Panel operativo del club</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2" aria-label="Secciones del club">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={navClass(item)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`${base}/jugadores/nuevo`}
            className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
            style={{ backgroundColor: "var(--club-primary, #1e3a5f)" }}
          >
            + Inscribir Jugador
          </Link>
          <UserAccountMenu email={user.email ?? null} profileHref="/liga/" />
        </div>
      </div>
    </header>
  );
}
