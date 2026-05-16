import Image from "next/image";
import Link from "next/link";
import { OFFICIAL_LEAGUE_NAME_UPPER } from "@/lib/league-branding";

export type LeagueHeaderLogoSize = "hero" | "compact";

const logoClassBySize: Record<LeagueHeaderLogoSize, string> = {
  /** `max-h-*` + `style` width/height auto: evita el aviso de Next/Image al escalar solo un eje. */
  hero: "max-h-36 w-auto shrink-0 object-contain",
  compact: "max-h-12 w-auto shrink-0 object-contain",
};

const textClassBySize: Record<LeagueHeaderLogoSize, string> = {
  hero:
    "min-w-0 max-w-[11rem] text-balance text-[10px] font-bold uppercase leading-snug tracking-tight text-slate-900 sm:max-w-[16rem] sm:text-xs md:max-w-[22rem] md:text-sm lg:text-base xl:text-lg",
  compact:
    "min-w-0 max-w-[9rem] text-balance text-[9px] font-bold uppercase leading-snug tracking-tight text-slate-900 sm:max-w-[13rem] sm:text-[10px] md:max-w-[18rem] md:text-xs lg:text-sm",
};

export type LeagueHeaderLogoProps = {
  /** `hero`: mismo alto que el portal público (`h-36`). `compact`: barra densa (p. ej. panel /liga). */
  size?: LeagueHeaderLogoSize;
  priority?: boolean;
  className?: string;
};

/**
 * Identidad de cabecera: escudo + nombre oficial. El bloque enlaza siempre al inicio del sitio (`/`).
 */
export function LeagueHeaderLogo({
  size = "hero",
  priority = false,
  className = "",
}: LeagueHeaderLogoProps) {
  return (
    <Link
      href="/"
      className={`relative z-20 flex min-w-0 max-w-full shrink-0 items-center gap-3 py-0.5 transition hover:opacity-90 ${className}`.trim()}
      title={`Inicio — ${OFFICIAL_LEAGUE_NAME_UPPER}`}
    >
      <Image
        src="/logo-liga.png"
        alt={OFFICIAL_LEAGUE_NAME_UPPER}
        width={420}
        height={144}
        className={logoClassBySize[size]}
        style={{ width: "auto", height: "auto" }}
        priority={priority}
      />
      <span className={textClassBySize[size]}>{OFFICIAL_LEAGUE_NAME_UPPER}</span>
    </Link>
  );
}
