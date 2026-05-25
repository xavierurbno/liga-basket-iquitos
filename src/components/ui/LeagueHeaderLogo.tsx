import Image from "next/image";
import Link from "next/link";
import { OFFICIAL_LEAGUE_NAME_UPPER } from "@/lib/league-branding";
import {
  DEFAULT_PUBLIC_LEAGUE_LOGO,
  isPrimaryPortalLeagueSlug,
} from "@/lib/logos/public-league-logo";

export type LeagueHeaderLogoSize = "hero" | "compact";

const logoBoxClassBySize: Record<LeagueHeaderLogoSize, string> = {
  hero: "relative h-36 w-[11rem] shrink-0 overflow-hidden rounded-xl",
  compact: "relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg",
};

const logoImageClassBySize: Record<LeagueHeaderLogoSize, string> = {
  hero: "h-full w-full object-contain object-left",
  compact: "h-full w-full object-contain object-left",
};

const textClassBySize: Record<LeagueHeaderLogoSize, string> = {
  hero:
    "min-w-0 max-w-[11rem] text-balance text-[10px] font-bold uppercase leading-snug tracking-tight text-slate-900 sm:max-w-[16rem] sm:text-xs md:max-w-[22rem] md:text-sm lg:text-base xl:text-lg",
  compact:
    "min-w-0 max-w-[9rem] text-balance text-[9px] font-bold uppercase leading-snug tracking-tight text-slate-900 sm:max-w-[13rem] sm:text-[10px] md:max-w-[18rem] md:text-xs lg:text-sm",
};

const placeholderClassBySize: Record<LeagueHeaderLogoSize, string> = {
  hero: "flex h-full w-full items-center justify-center bg-[#005CEE]/10 text-3xl font-black text-[#005CEE]",
  compact: "flex h-full w-full items-center justify-center bg-[#005CEE]/10 text-lg font-black text-[#005CEE]",
};

export type LeagueHeaderLogoProps = {
  size?: LeagueHeaderLogoSize;
  priority?: boolean;
  className?: string;
  href?: string;
  linkTitle?: string;
  /** Si se define, sustituye el nombre del programa LDDBI/Iquitos. */
  brandName?: string;
  /** Logo de la liga; si falta, en liga principal (Iquitos/LDDBI) se usa `public/logo-liga.png`. */
  logoUrl?: string | null;
  leagueSlug?: string;
};

function LeagueLogoMark({
  size,
  priority,
  brandName,
  logoUrl,
  leagueSlug,
}: {
  size: LeagueHeaderLogoSize;
  priority: boolean;
  brandName?: string;
  logoUrl?: string | null;
  leagueSlug?: string;
}) {
  const isLeagueContext = Boolean(brandName?.trim());
  const remote = logoUrl?.trim()?.startsWith("http") ?? false;
  const explicitLocal = logoUrl?.trim() && !remote ? logoUrl.trim() : null;
  const useProgramFallback = !isLeagueContext || isPrimaryPortalLeagueSlug(leagueSlug);
  const localSrc =
    explicitLocal ?? (useProgramFallback ? DEFAULT_PUBLIC_LEAGUE_LOGO : null);

  if (remote && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL Supabase/storage
      <img src={logoUrl} alt="" className={logoImageClassBySize[size]} />
    );
  }

  if (localSrc) {
    return (
      <Image
        src={localSrc}
        alt=""
        fill
        sizes={size === "hero" ? "176px" : "72px"}
        className={logoImageClassBySize[size]}
        priority={priority}
      />
    );
  }

  const initial = (brandName?.trim()?.charAt(0) ?? "L").toUpperCase();
  return <span className={placeholderClassBySize[size]} aria-hidden>{initial}</span>;
}

/**
 * Identidad de cabecera: programa LDDBI (por defecto) o liga concreta en `/l/[slug]/`.
 */
export function LeagueHeaderLogo({
  size = "hero",
  priority = false,
  className = "",
  href = "/",
  linkTitle,
  brandName,
  logoUrl,
  leagueSlug,
}: LeagueHeaderLogoProps) {
  const displayName = brandName?.trim()
    ? brandName.trim().toUpperCase()
    : OFFICIAL_LEAGUE_NAME_UPPER;
  const title = linkTitle ?? (brandName ? `Inicio — ${brandName}` : `Inicio — ${OFFICIAL_LEAGUE_NAME_UPPER}`);

  return (
    <Link
      href={href}
      className={`relative z-20 flex min-w-0 max-w-full shrink-0 items-center gap-3 py-0.5 transition hover:opacity-90 ${className}`.trim()}
      title={title}
    >
      <span className={logoBoxClassBySize[size]} aria-hidden>
        <LeagueLogoMark
          size={size}
          priority={priority}
          brandName={brandName}
          logoUrl={logoUrl}
          leagueSlug={leagueSlug}
        />
      </span>
      <span className={textClassBySize[size]}>{displayName}</span>
    </Link>
  );
}
