import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";

/** Prefijos de ciudad/sede conocidos por slug de liga. */
const SLUG_TO_PREFIX: Record<string, string> = {
  iquitos: "IQ",
  lddbi: "IQ",
  yurimaguas: "YUR",
};

const DEFAULT_PREFIX = "IQ";

/**
 * Código de 2–4 letras para el número de carnet: `{COD}-{año}-{cat}-{seq}`.
 */
export function resolveLeagueCarnetPrefix(opts: {
  slug?: string | null;
  name?: string | null;
}): string {
  const slug = opts.slug?.trim().toLowerCase();
  if (slug && SLUG_TO_PREFIX[slug]) {
    return SLUG_TO_PREFIX[slug];
  }

  const name = opts.name?.trim().toLowerCase() ?? "";
  if (name.includes("yurimaguas") || name.includes("yurim")) return "YUR";
  if (
    name.includes("iquitos") ||
    name.includes("lddbi") ||
    isPrimaryPortalLeagueSlug(slug ?? "")
  ) {
    return "IQ";
  }

  if (slug && slug.length >= 2) {
    return slug
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 4)
      .toUpperCase();
  }

  return DEFAULT_PREFIX;
}

/** Muestra el carnet con el prefijo de la liga actual (sin reescribir BD). */
export function formatCarnetNumberForLeague(
  carnetNumber: string | null | undefined,
  leaguePrefix: string,
): string | null {
  const raw = carnetNumber?.trim();
  if (!raw) return null;
  const prefix = leaguePrefix.trim().toUpperCase();
  if (!prefix) return raw;
  return raw.replace(/^[A-Z]{2,4}-/i, `${prefix}-`);
}

const CATEGORY_SEGMENT_LABELS: Record<string, string> = {
  U13: "Sub-13",
  U15: "Sub-15",
  U17: "Sub-17",
  U11: "Sub-11",
  MAY: "Mayores (18–39 años)",
  VET: "Veteranos (40+ años)",
  SUP: "Superior",
};

/** Texto legible para el segmento de categoría del número de carnet. */
export function labelCarnetCategorySegment(segment: string): string {
  const key = segment.trim().toUpperCase();
  return CATEGORY_SEGMENT_LABELS[key] ?? key;
}
