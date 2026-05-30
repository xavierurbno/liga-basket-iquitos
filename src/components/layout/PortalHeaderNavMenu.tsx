"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, LayoutDashboard, Menu, Trophy, type LucideIcon } from "lucide-react";

type PortalHeaderNavIcon = "intranet" | "ligas" | "campeonatos";

type MenuEntry = {
  href: string;
  label: string;
  icon: PortalHeaderNavIcon;
  title?: string;
  /** Anclas en la misma página (`/#campeonatos`): `<a>` nativo para scroll fiable. */
  nativeAnchor?: boolean;
};

const NAV_ICONS: Record<PortalHeaderNavIcon, LucideIcon> = {
  intranet: LayoutDashboard,
  ligas: Globe,
  campeonatos: Trophy,
};

const menuBtnClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f]";

const menuItemClass =
  "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50";

export function PortalHeaderNavMenu({
  intranetHref,
  ligasHref,
  campeonatosHref,
}: {
  intranetHref: string;
  ligasHref: string;
  campeonatosHref: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const items = useMemo<MenuEntry[]>(
    () => [
      {
        href: intranetHref,
        label: "Intranet",
        icon: "intranet",
        title: "Acceso al panel operativo de la liga",
      },
      {
        href: ligasHref,
        label: "Ligas",
        icon: "ligas",
        title: "Ver otras ligas del programa",
      },
      {
        href: campeonatosHref,
        label: "Campeonatos",
        icon: "campeonatos",
        nativeAnchor: true,
      },
    ],
    [intranetHref, ligasHref, campeonatosHref],
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="relative overflow-visible" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={menuBtnClass}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir menú de navegación"
      >
        <Menu className="h-5 w-5 shrink-0" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-200 mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5"
        >
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const content = (
              <>
                <Icon className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                {item.label}
              </>
            );

            if (item.nativeAnchor) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  title={item.title}
                  className={menuItemClass}
                  onClick={closeMenu}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                title={item.title}
                className={menuItemClass}
                onClick={closeMenu}
              >
                {content}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
