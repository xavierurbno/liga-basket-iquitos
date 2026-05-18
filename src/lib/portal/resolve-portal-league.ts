import { withQueryTimeout } from "@/lib/db/query-timeout";
import { leagueRepository } from "@/repositories/league.repository";

const LEAGUE_MS = 8_000;

/** Resuelve la liga del portal con una sola pasada a BD y timeout (evita RSC colgado). */
export async function resolvePortalLeagueId(opts: {
  querySlug?: string;
  cookieSlug?: string;
}): Promise<string | undefined> {
  try {
    if (opts.querySlug?.trim()) {
      const byQuery = await withQueryTimeout(
        leagueRepository.findBySlug(opts.querySlug.trim()),
        LEAGUE_MS,
        "portalLeagueByQuery"
      );
      if (byQuery) return byQuery.id;
    }

    if (opts.cookieSlug?.trim()) {
      const byCookie = await withQueryTimeout(
        leagueRepository.findBySlug(opts.cookieSlug.trim()),
        LEAGUE_MS,
        "portalLeagueByCookie"
      );
      if (byCookie) return byCookie.id;
    }

    const all = await withQueryTimeout(leagueRepository.findAll(), LEAGUE_MS, "portalLeagueAll");
    const match =
      all.find((l) => l.slug === "iquitos" || l.slug.includes("iquitos")) ?? all[0];
    return match?.id;
  } catch (err) {
    console.error("[portal] resolvePortalLeagueId:", err);
    return undefined;
  }
}
