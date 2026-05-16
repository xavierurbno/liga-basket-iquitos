"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CerrarSesionButton } from "@/components/auth/CerrarSesionButton";
import { ChevronDown, UserRound } from "lucide-react";

export function UserAccountMenu({
  email,
  profileHref = "/liga/",
}: {
  email: string | null;
  profileHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const initials = (email ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-white px-2 py-1.5 text-left text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#005CEE] hover:text-[#005CEE]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white"
          style={{ backgroundColor: "var(--nav-accent, #005CEE)" }}
        >
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">{email ?? "Usuario"}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-60 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-black/5"
        >
          <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <UserRound className="h-4 w-4 text-slate-400" aria-hidden />
            Panel de gestión
          </Link>
          <div className="border-t border-slate-100 px-3 py-2">
            <CerrarSesionButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
