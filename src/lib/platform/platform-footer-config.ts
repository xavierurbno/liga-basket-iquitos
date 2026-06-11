/** Enlaces del footer institucional (plataforma SaaS). */
export type PlatformFooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

/** WhatsApp público de soporte (Perú: +51 992 505 540). */
export const PLATFORM_FOOTER_SUPPORT_WHATSAPP_E164 = "51992505540";
export const PLATFORM_FOOTER_SUPPORT_WHATSAPP_DISPLAY = "+51 992 505 540";
export const PLATFORM_FOOTER_SUPPORT_WHATSAPP_URL = `https://wa.me/${PLATFORM_FOOTER_SUPPORT_WHATSAPP_E164}?text=${encodeURIComponent("Hola, necesito soporte de la Plataforma de ligas.")}`;

export function buildPlatformSystemLinks(): PlatformFooterLink[] {
  return [
    {
      label: "Soporte por WhatsApp",
      href: PLATFORM_FOOTER_SUPPORT_WHATSAPP_URL,
      external: true,
    },
  ];
}

export const PLATFORM_LEGAL_LINKS: PlatformFooterLink[] = [
  { label: "Términos y Condiciones", href: "/terminos/" },
  {
    label: "Política de Privacidad y Protección de Datos",
    href: "/privacidad/",
  },
];

/** Footers en `/l/{PLATFORM_DEFAULT_LEAGUE_SLUG}/` vía `LeaguePortalFooters`. */
export function shouldShowPlatformFooter(pathname: string): boolean {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  const normalized = path === "" ? "/" : path;
  const defaultSlug = process.env.PLATFORM_DEFAULT_LEAGUE_SLUG?.trim();
  if (!defaultSlug) return false;
  return normalized === `/l/${defaultSlug}`;
}
