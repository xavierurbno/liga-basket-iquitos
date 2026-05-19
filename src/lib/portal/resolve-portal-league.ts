import { cache } from "react";
import { QueryTimeoutError } from "@/lib/db/query-timeout";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import {
  fetchPortalLeagueBySlug,
  readPortalLeagueIdFromEnv,
  resolveDefaultPortalLeagueId,
} from "@/lib/portal/portal-league-cache";

/** En dev hay más secciones RSC en paralelo; el pool puede encolar consultas. */
const LEAGUE_MS =
  process.env.NODE_ENV === "development" ? 15_000 : 8_000;

/**
 * Resuelve la liga del portal (deduplicada por request + cache entre peticiones).
 * Orden: ?l= → cookie → liga Iquitos/default → `NEXT_PUBLIC_DEFAULT_LEAGUE_ID`.
 */
export const resolvePortalLeagueId = cache(
  async (opts: {
    querySlug?: string;
    cookieSlug?: string;
  }): Promise<string | undefined> => {
    try {
      if (opts.querySlug?.trim()) {
        const byQuery = await withQueryTimeout(
          fetchPortalLeagueBySlug(opts.querySlug.trim()),
          LEAGUE_MS,
          "portalLeagueByQuery",
        );
        if (byQuery) return byQuery.id;
      }

      if (opts.cookieSlug?.trim()) {
        const byCookie = await withQueryTimeout(
          fetchPortalLeagueBySlug(opts.cookieSlug.trim()),
          LEAGUE_MS,
          "portalLeagueByCookie",
        );
        if (byCookie) return byCookie.id;
      }

      const defaultId = await withQueryTimeout(
        resolveDefaultPortalLeagueId(),
        LEAGUE_MS,
        "portalLeagueDefault",
      );
      if (defaultId) return defaultId;

      return readPortalLeagueIdFromEnv();
    } catch (err) {
      const fallback = readPortalLeagueIdFromEnv();
      if (err instanceof QueryTimeoutError) {
        console.warn(
          `[portal] resolvePortalLeagueId timeout (${err.label});${fallback ? " usando NEXT_PUBLIC_DEFAULT_LEAGUE_ID." : " sin fallback."}`,
        );
      } else {
        console.error("[portal] resolvePortalLeagueId:", err);
      }
      return fallback;
    }
  },
);
