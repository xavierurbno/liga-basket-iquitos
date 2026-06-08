import { resolveLeagueCarnetPrefix } from "@/lib/leagues/league-carnet-prefix";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";

const LDDBI_SERIAL = "LDDBI";

/** Prefijo de serial documental (`PREFIJO - ID - correlativo`). */
export function resolveDocumentSerialPrefix(opts: {
  slug?: string | null;
  name?: string | null;
  documentSerialPrefix?: string | null;
}): string {
  const custom = opts.documentSerialPrefix?.trim().toUpperCase();
  if (custom) return custom.slice(0, 12);

  if (isPrimaryPortalLeagueSlug(opts.slug)) {
    return LDDBI_SERIAL;
  }

  return resolveLeagueCarnetPrefix({
    slug: opts.slug,
    name: opts.name,
  }).slice(0, 12);
}

export function formatDocumentSerialText(
  prefix: string,
  shortIdentifier: string,
  correlative: number,
  esCopia?: boolean,
): string {
  const copyMark = esCopia ? "C" : "";
  return `${prefix} - ${shortIdentifier} - ${copyMark}${correlative}`;
}
