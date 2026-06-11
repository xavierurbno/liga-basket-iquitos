import type { ReactNode } from "react";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import { OFFICIAL_LEAGUE_COPYRIGHT_NAME } from "@/lib/league-branding";
import { getPlatformName } from "@/lib/platform/platform-config";
import {
  PLATFORM_LEGAL_LINKS,
  buildPlatformSystemLinks,
} from "@/lib/platform/platform-footer-config";

const linkClass =
  "text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005CEE]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-sm";

const columnTitleClass =
  "text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400";

function FooterNavLink({ label, href, external }: { label: string; href: string; external?: boolean }) {
  if (external || href.startsWith("mailto:") || href.startsWith("https://wa.me")) {
    return (
      <a href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClass}>
      {label}
    </Link>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className={columnTitleClass}>{title}</h2>
      {children}
    </div>
  );
}

/**
 * Footer institucional (T&C, legal). Solo en `/l/lddbi/` junto a `SponsorFooter`.
 */
export function InstitutionalFooter() {
  const platformName = getPlatformName();
  const systemLinks = buildPlatformSystemLinks();
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative mt-auto w-full shrink-0 border-t border-slate-800 bg-slate-950 text-slate-300"
      aria-labelledby="platform-footer-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-500/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(67,56,202,0.12),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 id="platform-footer-heading" className="sr-only">
          Pie de página — {platformName}
        </h2>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {/* Columna 1 — Marca */}
          <FooterColumn title="Plataforma">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005CEE]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-[#005CEE] shadow-lg shadow-indigo-950/40 ring-1 ring-white/10"
                aria-hidden
              >
                <Layers3 className="h-5 w-5 text-white" strokeWidth={2.25} />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold tracking-tight text-white group-hover:text-indigo-100">
                  {platformName}
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/80">
                  Gestión deportiva
                </span>
              </span>
            </Link>
          </FooterColumn>

          {/* Columna 2 — Sistema */}
          <FooterColumn title="Enlaces del Sistema">
            <ul className="space-y-2.5" role="list">
              {systemLinks.map((item) => (
                <li key={item.label}>
                  <FooterNavLink {...item} />
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Columna 3 — Legal */}
          <FooterColumn title="Legal y Privacidad">
            <ul className="space-y-2.5" role="list">
              {PLATFORM_LEGAL_LINKS.map((item) => (
                <li key={item.label}>
                  <FooterNavLink {...item} />
                </li>
              ))}
            </ul>
          </FooterColumn>
        </div>

        {/* Fila inferior */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            &copy; {year} {OFFICIAL_LEAGUE_COPYRIGHT_NAME}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
