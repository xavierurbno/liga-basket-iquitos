"use client";

import Link from "next/link";
import { leaguePortalBusqueda365 } from "@/lib/portal/league-portal-paths";
import {
  Building2,
  Landmark,
  Search,
  Trophy,
  Globe,
  Images,
  FileText,
  Files,
  Scale,
  ShieldCheck,
  Palette,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

/** Elevación + brillo azul institucional (#005CEE) en hover/focus. */
const cardClass = [
  "group relative z-0 flex min-h-[6.75rem] cursor-pointer flex-col sm:min-h-[8.5rem]",
  "rounded-2xl border border-[#BFDBFE] bg-white p-4 sm:p-5",
  "transform translate-y-0 scale-100",
  "shadow-[0_20px_50px_-35px_rgba(59,130,246,0.55)]",
  "transition-[transform,box-shadow,border-color,ring-color] duration-300 ease-out",
  "hover:z-10 hover:-translate-y-1 hover:scale-[1.02]",
  "hover:border-[#005CEE]",
  "hover:shadow-[0_12px_28px_-8px_rgba(0,92,238,0.28),0_0_20px_rgba(0,92,238,0.4)]",
  "hover:ring-2 hover:ring-[#005CEE]/30",
  "focus-visible:z-10 focus-visible:outline-none",
  "focus-visible:-translate-y-1 focus-visible:scale-[1.02]",
  "focus-visible:border-[#005CEE]",
  "focus-visible:shadow-[0_12px_28px_-8px_rgba(0,92,238,0.28),0_0_20px_rgba(0,92,238,0.4)]",
  "focus-visible:ring-2 focus-visible:ring-[#005CEE]/40",
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100",
  "motion-reduce:focus-visible:translate-y-0 motion-reduce:focus-visible:scale-100",
].join(" ");

export type LigaHubCardItem = {
  href: string;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  body: string;
};

function busqueda365HubItem(leagueSlug: string | null): LigaHubCardItem {
  return {
    href: leagueSlug ? leaguePortalBusqueda365(leagueSlug) : "/busqueda-365/",
    icon: Search,
    iconClass: "text-amber-600",
    title: "Búsqueda 365",
    body: "Consulta pública de jugadores de tu liga.",
  };
}

/** Delegados: solo estas dos tarjetas y rutas exactas exigidas por negocio. */
function delegateHubItems(leagueSlug: string | null): readonly LigaHubCardItem[] {
  return [
    {
      href: "/liga/clubs/",
      icon: Building2,
      iconClass: "text-[#005CEE]",
      title: "Clubes y categorías",
      body: "Accede a la intranet de tu club para categorías, fichas y gestión del equipo (altas desde administración).",
    },
    busqueda365HubItem(leagueSlug),
  ];
}

function adminHubItems(leagueSlug: string | null): readonly LigaHubCardItem[] {
  return [
  {
    href: "/liga/clubs/",
    icon: Building2,
    iconClass: "text-[#005CEE]",
    title: "Clubes y categorías",
    body: "Alta y edición de clubes, categorías y fichas (entrenador, delegado de club y deportistas).",
  },
  {
    href: "/liga/tesoreria/",
    icon: Landmark,
    iconClass: "text-emerald-600",
    title: "Caja / Tesorería",
    body: "Movimientos, filtros por club y resumen financiero.",
  },
  busqueda365HubItem(leagueSlug),
  {
    href: "/liga/torneos/",
    icon: Trophy,
    iconClass: "text-violet-600",
    title: "Torneos",
    body: "Fixture, resultados, tabla y operación diaria del campeonato.",
  },
  {
    href: "/liga/portal-publico/",
    icon: Globe,
    iconClass: "text-[#1B3A6B]",
    title: "Portal y campeonatos",
    body: "Publica torneos en la portada y comparte el enlace del fixture público.",
  },
  {
    href: "/liga/configuracion/",
    icon: Palette,
    iconClass: "text-fuchsia-600",
    title: "Configuración de liga",
    body: "Temporada, reloj de pases, logo, colores del portal y carnet CR80.",
  },
  {
    href: "/liga/galeria-general/",
    icon: Images,
    iconClass: "text-sky-600",
    title: "Galería institucional",
    body: "Fotos del portal público.",
  },
  {
    href: "/liga/patrocinadores/",
    icon: FileText,
    iconClass: "text-rose-600",
    title: "Patrocinadores",
    body: "Logos que se muestran en el pie del portal público.",
  },
  {
    href: "/liga/documentos/",
    icon: Files,
    iconClass: "text-indigo-600",
    title: "Documentos",
    body: "Actas, circulares y archivos administrativos de la liga.",
  },
  {
    href: "/normativas/",
    icon: Scale,
    iconClass: "text-teal-700",
    title: "Normativas",
    body: "Reglamentos y normas publicadas para clubes y deportistas.",
  },
];
}

/** Solo SUPER_ADMIN: gestión global de ligas (crear / eliminar / fichas). */
const superAdminPlatformCard: LigaHubCardItem = {
  href: "/super-admin/leagues/",
  icon: LayoutGrid,
  iconClass: "text-[#005CEE]",
  title: "Plataforma — Ligas",
  body: "Único acceso de plataforma: listado, alta, ficha y eliminación de ligas.",
};

const profilesCard: LigaHubCardItem = {
  href: "/liga/perfiles/",
  icon: ShieldCheck,
  iconClass: "text-emerald-700",
  title: "Perfiles",
  body: "Administrar accesos de usuarios, asignar roles de administrador o delegados y revocar cuentas de la liga.",
};

export type LigaHubViewerSegment = "delegate" | "staff";

type LigaHubCardGridProps = {
  viewerSegment: LigaHubViewerSegment;
  /** Slug de la liga operativa (enlaces a Búsqueda 365 por tenant). */
  activeLeagueSlug?: string | null;
  /** Solo SUPER_ADMIN y LEAGUE_ADMIN en modo staff. */
  showProfilesCard?: boolean;
  /** Tarjeta hacia /super-admin/leagues (solo super administrador). */
  showSuperAdminPlatform?: boolean;
};

export function LigaHubCardGrid({
  viewerSegment,
  activeLeagueSlug = null,
  showProfilesCard = false,
  showSuperAdminPlatform = false,
}: LigaHubCardGridProps) {
  const slug = activeLeagueSlug?.trim() || null;
  const adminItems = adminHubItems(slug);
  const staffBase: LigaHubCardItem[] = showProfilesCard
    ? [...adminItems.slice(0, 2), profilesCard, ...adminItems.slice(2)]
    : [...adminItems];

  const items: LigaHubCardItem[] =
    viewerSegment === "delegate"
      ? [...delegateHubItems(slug)]
      : showSuperAdminPlatform
        ? [superAdminPlatformCard, ...staffBase]
        : staffBase;

  return (
    <div className="relative z-1 grid items-stretch gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {items.map(({ href, icon: Icon, iconClass, title, body }) => (
        <Link key={`${href}-${title}`} href={href} className={`${cardClass} h-full`}>
          <Icon
            className={`h-6 w-6 shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none group-hover:scale-105 motion-reduce:group-hover:scale-100 sm:h-8 sm:w-8 ${iconClass}`}
            aria-hidden
          />
          <h2 className="mt-2 text-base font-bold text-slate-900 transition-colors duration-300 ease-out group-hover:text-[#005CEE] sm:mt-3 sm:text-lg">
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">{body}</p>
        </Link>
      ))}
    </div>
  );
}
