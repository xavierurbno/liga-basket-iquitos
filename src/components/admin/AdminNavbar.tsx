"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeagueHeaderLogo } from "@/components/ui/LeagueHeaderLogo";
interface AdminNavbarProps {
  userEmail?: string;
}

export function AdminNavbar({ userEmail }: AdminNavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      name: "Ligas",
      href: "/super-admin/leagues",
      active: pathname.startsWith("/super-admin/leagues"),
    },
    {
      name: "Patrocinadores",
      href: "/super-admin/sponsors",
      active: pathname.startsWith("/super-admin/sponsors"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <LeagueHeaderLogo size="compact" className="max-w-[min(100%,28rem)] md:max-w-none" />
          <Link
            href="/super-admin/dashboard"
            className="group hidden shrink-0 transition-opacity hover:opacity-80 sm:block"
          >
            <span className="block text-sm font-black uppercase leading-tight tracking-tighter text-slate-900">
              Super <span className="text-blue-600">Admin</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Gestión central
            </span>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/liga/"
            className="rounded-xl border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-bold text-[#005CEE] transition hover:bg-blue-50"
          >
            Panel operativo
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                link.active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              {link.name}
            </Link>
          ))}
          {userEmail ? (
            <span className="hidden max-w-[160px] truncate text-[10px] text-slate-400 lg:inline">
              {userEmail}
            </span>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
