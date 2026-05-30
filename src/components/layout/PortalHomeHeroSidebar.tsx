import Link from "next/link";
import { getSponsorsByLeagueAction } from "@/lib/actions/sponsors";
import { leaguePortalBusqueda365, leaguePortalNormativas } from "@/lib/portal/league-portal-paths";
import { reactListKey } from "@/lib/react/listKey";

function ctaFallbackForLeague(leagueSlug?: string) {
  const slug = leagueSlug?.trim();
  const normativasHref = slug ? leaguePortalNormativas(slug) : "/normativas/";
  const busquedaHref = slug ? leaguePortalBusqueda365(slug) : "/busqueda-365/";
  return [
  {
    href: normativasHref,
    title: "Normativas",
    subtitle: "Documentación oficial de la liga",
    className: "from-slate-800 to-slate-950",
  },
  {
    href: busquedaHref,
    title: "Búsqueda 365",
    subtitle: "Consulta la base deportiva",
    className: "from-[#1e3a5f] to-slate-900",
  },
] as const;
}

/**
 * Columna derecha estilo FEB: dos bloques apilados (patrocinadores o CTAs).
 */
export async function PortalHomeHeroSidebar({
  leagueId,
  leagueSlug,
}: {
  leagueId?: string;
  leagueSlug?: string;
}) {
  const ctaFallback = ctaFallbackForLeague(leagueSlug);
  const sponsors =
    leagueId != null ? await getSponsorsByLeagueAction(leagueId) : [];
  const top = sponsors.slice(0, 2);

  const slots: Array<
    | { kind: "sponsor"; id: string; name: string; logoUrl: string; websiteUrl: string | null }
    | { kind: "cta"; href: string; title: string; subtitle: string; className: string }
  > = [];

  for (let i = 0; i < 2; i++) {
    const s = top[i];
    if (s) {
      slots.push({
        kind: "sponsor",
        id: s.id,
        name: s.name,
        logoUrl: s.logoUrl,
        websiteUrl: s.websiteUrl,
      });
    } else {
      const c = ctaFallback[i];
      slots.push({
        kind: "cta",
        href: c.href,
        title: c.title,
        subtitle: c.subtitle,
        className: c.className,
      });
    }
  }

  return (
    <aside
      className="flex min-h-0 flex-col gap-4 lg:col-span-3 lg:h-full"
      aria-label="Destacados"
    >
      {slots.map((slot, idx) =>
        slot.kind === "sponsor" ? (
          <a
            key={reactListKey(slot.id, idx, "hero-sponsor", slot.logoUrl)}
            href={slot.websiteUrl || "#"}
            target={slot.websiteUrl ? "_blank" : undefined}
            rel={slot.websiteUrl ? "noopener noreferrer" : undefined}
            className="flex min-h-[140px] flex-1 flex-col items-center justify-center rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <img
              src={slot.logoUrl}
              alt={slot.name}
              className="max-h-24 w-auto max-w-full object-contain"
            />
            <span className="mt-2 line-clamp-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {slot.name}
            </span>
          </a>
        ) : (
          <Link
            key={`${slot.href}-${idx}`}
            href={slot.href}
            className={`flex min-h-[140px] flex-1 flex-col justify-end rounded-lg border border-white/10 bg-linear-to-br ${slot.className} p-4 text-white shadow-md transition hover:opacity-95`}
          >
            <span className="text-sm font-bold tracking-tight">{slot.title}</span>
            <span className="mt-1 text-xs text-white/80">{slot.subtitle}</span>
          </Link>
        )
      )}
    </aside>
  );
}
