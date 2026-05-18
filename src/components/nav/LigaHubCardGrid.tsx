"use client";

import Link from "next/link";
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
  type LucideIcon,
} from "lucide-react";

const cardClass =
  "relative z-0 flex min-h-[8.5rem] cursor-pointer flex-col rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.55)] transition hover:border-[#005CEE] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CEE]";

export type LigaHubCardItem = {
  href: string;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  body: string;
};

/** Delegados: solo estas dos tarjetas y rutas exactas exigidas por negocio. */
const delegateHubItems: readonly LigaHubCardItem[] = [
  {
    href: "/liga/clubs/",
    icon: Building2,
    iconClass: "text-[#005CEE]",
    title: "Clubes y categorías",
    body: "Accede a la intranet de tu club para categorías, fichas y gestión del equipo (altas desde administración).",
  },
  {
    href: "/busqueda-365/",
    icon: Search,
    iconClass: "text-amber-600",
    title: "Búsqueda 365",
    body: "Consulta pública de jugadores habilitados.",
  },
];

const adminHubItems: readonly LigaHubCardItem[] = [
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
  {
    href: "/busqueda-365/",
    icon: Search,
    iconClass: "text-amber-600",
    title: "Búsqueda 365",
    body: "Consulta pública de jugadores habilitados.",
  },
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
  /** Solo SUPER_ADMIN y LEAGUE_ADMIN en modo staff. */
  showProfilesCard?: boolean;
};

export function LigaHubCardGrid({
  viewerSegment,
  showProfilesCard = false,
}: LigaHubCardGridProps) {
  const items: LigaHubCardItem[] =
    viewerSegment === "delegate"
      ? [...delegateHubItems]
      : showProfilesCard
        ? [...adminHubItems.slice(0, 2), profilesCard, ...adminHubItems.slice(2)]
        : [...adminHubItems];

  return (
    <div className="relative z-1 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ href, icon: Icon, iconClass, title, body }) => (
        <Link key={`${href}-${title}`} href={href} className={`${cardClass} h-full`}>
          <Icon className={`h-8 w-8 shrink-0 ${iconClass}`} aria-hidden />
          <h2 className="mt-3 text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{body}</p>
        </Link>
      ))}
    </div>
  );
}
