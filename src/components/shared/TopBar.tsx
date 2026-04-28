"use client";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { ClubContext } from "@/app/(dashboard)/[clubSlug]/layout";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard", jugadores: "Jugadores", caja: "Caja",
  documentos: "Documentos", torneos: "Torneos", reportes: "Reportes",
  configuracion: "Configuración", nuevo: "Nuevo", editar: "Editar",
};

export function TopBar({ club, user }: { club: ClubContext; user: User }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean)
    .filter((s) => s !== "dashboard" && s !== club.slug)
    .map((s) => ROUTE_LABELS[s] || s);
  const userInitials = (user.email ?? "U").substring(0, 2).toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{club.nombre}</span>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-slate-400">/</span>
            <span className={i === segments.length - 1 ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500 dark:text-slate-400"}>{seg}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <a href={`/dashboard/${club.slug}/jugadores/nuevo`} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--club-primary, #1e3a5f)" }}>
          <span>+ Inscribir Jugador</span>
        </a>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: "var(--club-primary, #1e3a5f)" }}>{userInitials}</div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{user.email}</p>
            <p className="text-[10px] text-slate-500">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
