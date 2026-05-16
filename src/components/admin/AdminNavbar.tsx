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
      name: "Liga",
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
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
        {/* Identidad visual + nombre oficial */}
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <LeagueHeaderLogo size="compact" className="max-w-[min(100%,28rem)] md:max-w-none" />
          <Link
            href="/super-admin/liga"
            className="hidden shrink-0 group transition-opacity hover:opacity-80 sm:block"
          >
            <span className="block text-sm font-black uppercase leading-tight tracking-tighter text-slate-900">
              Super <span className="text-blue-600">Admin</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Gestión Central
            </span>
          </Link>
        </div>
        
        {/* Navegación Principal */}
        <nav className="flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-bold transition-all px-4 py-2 rounded-xl ${
                link.active 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                  : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
        </nav>
      </div>
    </header>
  );
}
