/** Presentación de logos estilo FEB: fondo negro plano, sin cajas, monocromo claro. */

export const SPONSOR_FEB_CATEGORY_LABEL_CLASS =
  "text-[10px] md:text-[11px] font-black text-white uppercase tracking-[0.28em] whitespace-nowrap";

/** Alturas por jerarquía (socios > técnico > oficiales > proveedores). */
export const SPONSOR_LOGO_HEIGHT_CLASS: Record<string, string> = {
  SOCIOS_PATROCINADORES: "h-14 md:h-[4.5rem]",
  PATR_TECNICO: "h-12 md:h-16",
  PATROCINADORES_OFICIALES: "h-10 md:h-14",
  PROVEEDORES: "h-9 md:h-12",
  INSTITUCIONALES: "h-9 md:h-12",
};

export function sponsorLogoHeightClass(category?: string): string {
  if (category && SPONSOR_LOGO_HEIGHT_CLASS[category]) {
    return SPONSOR_LOGO_HEIGHT_CLASS[category];
  }
  return "h-10 md:h-14";
}

/** Logos sobre negro: sin caja; PNG blanco transparente recomendado. */
export function sponsorFebLogoClass(category?: string): string {
  return [
    sponsorLogoHeightClass(category),
    "w-auto max-w-[min(100%,12rem)] md:max-w-[14rem] object-contain object-center",
    "opacity-90 transition-opacity duration-300",
    "hover:opacity-100",
    "motion-safe:group-hover:opacity-100",
  ].join(" ");
}

export function sponsorCarouselLogoClass(): string {
  return [
    "max-h-[5.5rem] w-auto max-w-full object-contain object-center",
    "opacity-95 transition-opacity duration-300 hover:opacity-100",
  ].join(" ");
}
